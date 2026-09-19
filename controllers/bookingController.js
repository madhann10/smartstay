import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { generateInvoicePdf } from '../services/pdfService.js';
import { sendBookingEmail } from '../services/emailService.js';

// =============================================================================
// Helpers
// =============================================================================

const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

const error = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/** Generate a readable booking ID like STY-48291 */
const generateBookingId = () =>
  `STY-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10)}`;

/** Generate an invoice number like INV-20260918-00001 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `INV-${dateStr}-${rand}`;
};

// =============================================================================
// POST /api/bookings
// Create a booking. Backend retrieves user from session token and price from DB.
// Sends automatic booking confirmation + PDF invoice attachment via email.
// =============================================================================
export const createBooking = async (req, res) => {
  try {
    const { hotelId, roomId, checkIn, checkOut, guests, guestName } = req.body;
    const rawUserId = req.user?._id || req.user?.id;

    if (!rawUserId) {
      return error(res, 'Authentication token missing user identification.', 401);
    }

    // Retrieve user from DB via authenticated session token ID
    const user = await User.findById(rawUserId);
    if (!user) {
      return error(res, 'Authenticated user account not found.', 404);
    }

    // --- Validate required fields ---
    if (!hotelId || !roomId || !checkIn || !checkOut) {
      return error(res, 'hotelId, roomId, checkIn, and checkOut are required.', 400);
    }

    if (!isValidId(hotelId)) {
      return error(res, 'Invalid hotel ID format.', 400);
    }

    // --- Validate dates ---
    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return error(res, 'Invalid date format.', 400);
    }

    if (checkOutDate <= checkInDate) {
      return error(res, 'Check-out date must be after check-in date.', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return error(res, 'Check-in date cannot be in the past.', 400);
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      return error(res, 'Booking must be for at least 1 night.', 400);
    }

    // --- Fetch hotel and room from DB (backend controls the price) ---
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    let room;
    if (isValidId(roomId)) {
      room = hotel.rooms.id(roomId);
    }
    if (!room) {
      room = hotel.rooms.find((r) => r._id.toString() === roomId.toString());
    }
    if (!room) {
      return error(res, 'Room not found in this hotel.', 404);
    }

    if (!room.isAvailable) {
      return error(res, 'This room is currently unavailable.', 400);
    }

    // --- Backend price calculation (ignores any price sent from frontend) ---
    const pricePerNight = room.basePrice;
    const subtotal      = pricePerNight * nights;
    const tax           = Math.round(subtotal * 0.12); // 12% GST
    const totalAmount   = subtotal + tax;

    // --- Create booking bound strictly to the authenticated user._id ---
    const bookingId     = generateBookingId();
    const invoiceNumber = generateInvoiceNumber();
    const paymentId     = `PAY-DEMO-${Date.now()}`;

    const booking = await Booking.create({
      bookingId,
      invoiceNumber,
      user:    user._id,
      hotel:   hotel._id,
      roomId:  room._id,
      roomType:   room.type,
      roomNumber: room.roomNumber,
      pricePerNight,
      checkIn:  checkInDate,
      checkOut: checkOutDate,
      guests:   Number(guests) || 1,
      nights,
      subtotal,
      tax,
      totalAmount,
      bookingStatus: 'Confirmed',
      paymentStatus: 'Paid',
      paymentId,
      paymentMethod: 'DEMO Payment',
      hotelSnapshot: {
        name:    hotel.name,
        city:    hotel.location.city,
        state:   hotel.location.state || '',
        address: hotel.location.address,
      },
      customerSnapshot: {
        name:  guestName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      },
    });

    // --- Automatic PDF Invoice & Email Confirmation ---
    // Rule: Failure to send email must NOT cancel or delete a successful booking
    let emailStatus = { success: false, note: '' };
    try {
      const pdfBuffer = await generateInvoicePdf(booking);
      emailStatus = await sendBookingEmail({
        booking,
        recipientEmail: user.email,
        pdfBuffer,
      });

      if (emailStatus.success) {
        booking.invoiceEmailed      = true;
        booking.invoiceEmailSentAt  = new Date();
        booking.emailDeliveryStatus = 'sent';
      } else {
        booking.emailDeliveryStatus = 'failed';
        booking.emailErrorMessage   = emailStatus.error || 'Email dispatch failed';
      }
      await booking.save();
    } catch (emailErr) {
      console.error(`[BOOKING EMAIL NOTICE] Email process error for booking #${booking.bookingId}:`, emailErr.message);
      booking.emailDeliveryStatus = 'failed';
      booking.emailErrorMessage   = emailErr.message;
      await booking.save();
    }

    return success(res, {
      booking,
      emailSent: booking.invoiceEmailed,
      emailRecipient: user.email,
      emailNote: emailStatus.note || (booking.invoiceEmailed ? 'Email sent successfully' : 'Email log available on server'),
    }, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join('. '), 400);
    }
    return error(res, err.message);
  }
};

// =============================================================================
// GET /api/bookings
// List all bookings belonging strictly to the authenticated user (newest first).
// =============================================================================
export const getMyBookings = async (req, res) => {
  try {
    const rawUserId = req.user?._id || req.user?.id;
    if (!rawUserId) {
      return error(res, 'Authentication required.', 401);
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({ user: rawUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ user: rawUserId }),
    ]);

    return success(res, {
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// =============================================================================
// GET /api/bookings/:bookingId
// Get a single booking. Security check: only the owner can access it.
// =============================================================================
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const rawUserId     = req.user?._id || req.user?.id;

    if (!rawUserId) {
      return error(res, 'Authentication required.', 401);
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }

    // Security: strictly check that booking user matches authenticated user
    if (booking.user.toString() !== rawUserId.toString()) {
      return error(res, 'Access denied.', 403);
    }

    return success(res, { booking });
  } catch (err) {
    return error(res, err.message);
  }
};

// =============================================================================
// GET /api/bookings/:bookingId/invoice
// Returns full invoice data. Only the booking owner can access.
// Sensitive fields (passwords, OTPs, tokens) are never included.
// =============================================================================
export const getInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const rawUserId     = req.user?._id || req.user?.id;

    if (!rawUserId) {
      return error(res, 'Authentication required.', 401);
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return error(res, 'Invoice not found.', 404);
    }

    // Security: strictly check that booking user matches authenticated user
    if (booking.user.toString() !== rawUserId.toString()) {
      return error(res, 'Access denied.', 403);
    }

    const invoice = {
      invoiceNumber:   booking.invoiceNumber,
      bookingId:       booking.bookingId,
      paymentId:       booking.paymentId,
      paymentMethod:   booking.paymentMethod,
      paymentDate:     booking.updatedAt,
      bookingDate:     booking.createdAt,
      customer: {
        name:  booking.customerSnapshot.name,
        email: booking.customerSnapshot.email,
        phone: booking.customerSnapshot.phone,
      },
      hotel: {
        name:    booking.hotelSnapshot.name,
        city:    booking.hotelSnapshot.city,
        state:   booking.hotelSnapshot.state,
        address: booking.hotelSnapshot.address,
      },
      checkIn:       booking.checkIn,
      checkOut:      booking.checkOut,
      nights:        booking.nights,
      guests:        booking.guests,
      roomType:      booking.roomType,
      roomNumber:    booking.roomNumber,
      pricePerNight: booking.pricePerNight,
      subtotal:      booking.subtotal,
      tax:           booking.tax,
      totalAmount:   booking.totalAmount,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      invoiceEmailed:       booking.invoiceEmailed,
      invoiceEmailSentAt:   booking.invoiceEmailSentAt,
      emailDeliveryStatus:  booking.emailDeliveryStatus,
    };

    return success(res, { invoice });
  } catch (err) {
    return error(res, err.message);
  }
};

// =============================================================================
// POST /api/bookings/:bookingId/resend-invoice
// Manually resends invoice email with PDF attachment to registered user email.
// Owner restricted.
// =============================================================================
export const resendInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const rawUserId     = req.user?._id || req.user?.id;

    if (!rawUserId) {
      return error(res, 'Authentication required.', 401);
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return error(res, 'Booking not found.', 404);
    }

    if (booking.user.toString() !== rawUserId.toString()) {
      return error(res, 'Access denied.', 403);
    }

    const user = await User.findById(rawUserId);
    if (!user || !user.email) {
      return error(res, 'Registered user email address not found.', 404);
    }

    const pdfBuffer = await generateInvoicePdf(booking);
    const emailResult = await sendBookingEmail({
      booking,
      recipientEmail: user.email,
      pdfBuffer,
    });

    if (emailResult.success) {
      booking.invoiceEmailed      = true;
      booking.invoiceEmailSentAt  = new Date();
      booking.emailDeliveryStatus = 'sent';
      await booking.save();

      return success(res, {
        message: `Invoice email sent successfully to ${user.email}.`,
        emailRecipient: user.email,
        emailDeliveryStatus: 'sent',
      });
    } else {
      booking.emailDeliveryStatus = 'failed';
      booking.emailErrorMessage   = emailResult.error || 'Failed to resend email';
      await booking.save();

      return error(res, emailResult.error || 'Unable to deliver invoice email at this time.', 500);
    }
  } catch (err) {
    return error(res, err.message);
  }
};
