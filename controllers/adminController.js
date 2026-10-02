import mongoose from 'mongoose';
import LoginActivity from '../models/LoginActivity.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

const activeSince = () => new Date(Date.now() - Number(process.env.ACTIVE_SESSION_TIMEOUT_MINUTES || 30) * 60 * 1000);

// =============================================================================
// OVERVIEW & ANALYTICS
// =============================================================================

export const getOverviewStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Total hotels
    const totalHotels = await Hotel.countDocuments();

    // 2. Available rooms count across all hotels
    const hotels = await Hotel.find({}, 'rooms').lean();
    const availableRooms = hotels.reduce((acc, h) => {
      return acc + (h.rooms ? h.rooms.filter((r) => r.isAvailable !== false).length : 0);
    }, 0);

    // 3. Today's bookings count
    const todaysBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // 4. Total revenue from Paid bookings
    const revAgg = await Booking.aggregate([
      { $match: { paymentStatus: 'Paid', bookingStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revAgg[0]?.total || 0;

    // 5. Recent bookings (latest 10)
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json({
      success: true,
      stats: {
        totalHotels,
        availableRooms,
        todaysBookings,
        totalRevenue,
      },
      recentBookings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load overview statistics.' });
  }
};

// =============================================================================
// HOTELS ADMIN
// =============================================================================

export const getAdminHotels = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search.trim()) {
      const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { 'location.city': { $regex: pattern, $options: 'i' } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      Hotel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Hotel.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      hotels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load hotels.' });
  }
};

export const createAdminHotel = async (req, res) => {
  try {
    const { name, city, state, address, propertyType, basePrice, rating, description, amenities } = req.body;

    if (!name || !city || !address) {
      return res.status(400).json({ success: false, message: 'Hotel name, city, and address are required.' });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const initialPrice = Number(basePrice) || 2500;

    const hotel = await Hotel.create({
      name,
      slug,
      description: description || '',
      location: {
        city,
        state: state || '',
        address,
      },
      propertyType: propertyType || 'Hotel',
      rating: Number(rating) || 4.5,
      amenities: Array.isArray(amenities)
        ? amenities
        : (amenities ? String(amenities).split(',').map((s) => s.trim()) : ['Wi-Fi', 'Air Conditioning', 'Breakfast']),
      images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70'],
      rooms: [
        {
          roomNumber: '101',
          type: 'Deluxe',
          capacity: 2,
          basePrice: initialPrice,
          amenities: ['Wi-Fi', 'Air Conditioning'],
          isAvailable: true,
        },
      ],
    });

    return res.status(201).json({ success: true, hotel });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to create hotel.' });
  }
};

export const getAdminHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    return res.json({ success: true, hotel });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to fetch hotel.' });
  }
};

export const updateAdminHotel = async (req, res) => {
  try {
    const { name, city, state, address, propertyType, rating, description, amenities } = req.body;
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    if (name) hotel.name = name.trim();
    if (city) {
      hotel.location = hotel.location || {};
      hotel.location.city = city.trim();
    }
    if (state !== undefined) {
      hotel.location = hotel.location || {};
      hotel.location.state = state.trim();
    }
    if (address) {
      hotel.location = hotel.location || {};
      hotel.location.address = address.trim();
    }
    if (propertyType) hotel.propertyType = propertyType;
    if (rating !== undefined) hotel.rating = Number(rating);
    if (description !== undefined) hotel.description = description.trim();
    if (amenities !== undefined) {
      hotel.amenities = Array.isArray(amenities) ? amenities : String(amenities).split(',').map((s) => s.trim()).filter(Boolean);
    }

    await hotel.save();
    return res.json({ success: true, hotel, message: 'Hotel updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to update hotel.' });
  }
};

export const deleteAdminHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });
    return res.json({ success: true, message: 'Hotel deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to delete hotel.' });
  }
};

// =============================================================================
// USERS ADMIN
// =============================================================================

export const getAdminUsers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search.trim()) {
      const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: pattern, $options: 'i' } },
        { email: { $regex: pattern, $options: 'i' } },
        { phone: { $regex: pattern, $options: 'i' } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    // Determine active status using LoginActivity within active session window
    const activeActivities = await LoginActivity.aggregate([
      { $match: { status: 'SUCCESS', logoutTime: null, loginTime: { $gte: activeSince() } } },
      { $group: { _id: '$userId' } },
    ]);
    const activeUserIds = new Set(activeActivities.map((a) => String(a._id)));

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash -passwordResetHash -passwordResetExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    const enrichedUsers = users.map((u) => ({
      ...u,
      status: activeUserIds.has(String(u._id)) ? 'Active' : 'Offline',
    }));

    return res.json({
      success: true,
      users: enrichedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load users.' });
  }
};

// =============================================================================
// ROOMS ADMIN
// =============================================================================

export const getAdminRooms = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const hotels = await Hotel.find().lean();
    let allRooms = [];

    hotels.forEach((h) => {
      if (h.rooms && h.rooms.length > 0) {
        h.rooms.forEach((r) => {
          const dynamicPrice = Math.round(r.basePrice * 1.12);
          allRooms.push({
            _id: r._id,
            roomNumber: r.roomNumber,
            hotelId: h._id,
            hotelName: h.name,
            type: r.type,
            capacity: r.capacity,
            basePrice: r.basePrice,
            dynamicPrice,
            isAvailable: r.isAvailable !== false,
            status: r.isAvailable !== false ? 'Available' : 'Occupied',
          });
        });
      }
    });

    if (search.trim()) {
      const lower = search.trim().toLowerCase();
      allRooms = allRooms.filter(
        (r) =>
          r.roomNumber.toLowerCase().includes(lower) ||
          r.hotelName.toLowerCase().includes(lower) ||
          r.type.toLowerCase().includes(lower)
      );
    }

    const total    = allRooms.length;
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;
    const paginatedRooms = allRooms.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      rooms: paginatedRooms,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load rooms.' });
  }
};

export const createAdminRoom = async (req, res) => {
  try {
    const { hotelId, roomNumber, type, capacity, basePrice, amenities, isAvailable } = req.body;

    if (!hotelId || !roomNumber || !type || basePrice == null) {
      return res.status(400).json({ success: false, message: 'hotelId, roomNumber, type, and basePrice are required.' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found.' });
    }

    const duplicate = hotel.rooms.find((r) => r.roomNumber === String(roomNumber).trim());
    if (duplicate) {
      return res.status(409).json({ success: false, message: `Room number "${roomNumber}" already exists in this hotel.` });
    }

    hotel.rooms.push({
      roomNumber: String(roomNumber).trim(),
      type,
      capacity: Number(capacity) || 2,
      basePrice: Number(basePrice),
      amenities: Array.isArray(amenities) ? amenities : (amenities ? String(amenities).split(',').map((s) => s.trim()) : []),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    await hotel.save();
    const newRoom = hotel.rooms[hotel.rooms.length - 1];

    return res.status(201).json({ success: true, room: newRoom, hotelName: hotel.name });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to create room.' });
  }
};

export const updateAdminRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { roomNumber, type, capacity, basePrice, amenities, isAvailable } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    const room = hotel.rooms.id(roomId) || hotel.rooms.find((r) => String(r._id) === roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    if (roomNumber !== undefined && String(roomNumber).trim()) {
      const duplicate = hotel.rooms.find((r) => String(r._id) !== String(room._id) && r.roomNumber === String(roomNumber).trim());
      if (duplicate) {
        return res.status(409).json({ success: false, message: `Room number "${roomNumber}" already exists in this hotel.` });
      }
      room.roomNumber = String(roomNumber).trim();
    }

    if (type !== undefined) room.type = type;
    if (capacity !== undefined) room.capacity = Number(capacity);
    if (basePrice !== undefined) room.basePrice = Number(basePrice);
    if (isAvailable !== undefined) room.isAvailable = Boolean(isAvailable);
    if (amenities !== undefined) {
      room.amenities = Array.isArray(amenities) ? amenities : String(amenities).split(',').map((s) => s.trim()).filter(Boolean);
    }

    await hotel.save();
    return res.json({ success: true, room, message: 'Room updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to update room.' });
  }
};

export const deleteAdminRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    const room = hotel.rooms.id(roomId) || hotel.rooms.find((r) => String(r._id) === roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    hotel.rooms.pull(room._id);
    await hotel.save();
    return res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to delete room.' });
  }
};

// =============================================================================
// BOOKINGS ADMIN
// =============================================================================

export const getAdminBookings = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search.trim()) {
      const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { bookingId: { $regex: pattern, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: pattern, $options: 'i' } },
        { 'customerSnapshot.email': { $regex: pattern, $options: 'i' } },
        { 'hotelSnapshot.name': { $regex: pattern, $options: 'i' } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Booking.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load bookings.' });
  }
};

export const getAdminBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const booking = await Booking.findOne({
      $or: [{ bookingId: id }, ...(isObjId ? [{ _id: id }] : [])]
    }).lean();
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.json({ success: true, booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to fetch booking.' });
  }
};

export const updateAdminBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required.' });

    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Checked In', 'Checked Out'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status "${status}". Choose from: ${validStatuses.join(', ')}` });
    }

    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const booking = await Booking.findOne({
      $or: [{ bookingId: id }, ...(isObjId ? [{ _id: id }] : [])]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.bookingStatus = status;
    await booking.save();
    return res.json({ success: true, booking, message: `Booking status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to update booking status.' });
  }
};

export const cancelAdminBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const booking = await Booking.findOne({
      $or: [{ bookingId: id }, ...(isObjId ? [{ _id: id }] : [])]
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    booking.bookingStatus = 'Cancelled';
    await booking.save();
    return res.json({ success: true, message: 'Booking cancelled successfully.', booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to cancel booking.' });
  }
};

// =============================================================================
// PRICING ADMIN
// =============================================================================

export const getAdminPricing = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const hotels = await Hotel.find().lean();
    let pricingList = [];

    hotels.forEach((h) => {
      if (h.rooms && h.rooms.length > 0) {
        h.rooms.forEach((r) => {
          const base = r.basePrice;
          const dynamic = Math.round(base * 1.12);
          pricingList.push({
            hotelId: h._id,
            roomId: r._id,
            roomNumber: r.roomNumber,
            hotel: h.name,
            room: r.type,
            base,
            demand: r.basePrice > 4000 ? 'High' : (r.basePrice > 2000 ? 'Medium' : 'Low'),
            occupancy: r.isAvailable ? 65 : 90,
            dynamic,
            status: r.isAvailable !== false ? 'Active' : 'Unavailable',
          });
        });
      }
    });

    if (search.trim()) {
      const lower = search.trim().toLowerCase();
      pricingList = pricingList.filter(
        (p) =>
          p.hotel.toLowerCase().includes(lower) ||
          p.room.toLowerCase().includes(lower) ||
          String(p.roomNumber || '').toLowerCase().includes(lower) ||
          p.demand.toLowerCase().includes(lower)
      );
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;
    const paginated = pricingList.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      pricing: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: pricingList.length,
        pages: Math.ceil(pricingList.length / limitNum) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load pricing data.' });
  }
};

export const updateAdminRoomPrice = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { basePrice } = req.body;
    if (basePrice == null || isNaN(basePrice) || Number(basePrice) < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative base price is required.' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found.' });

    const room = hotel.rooms.id(roomId) || hotel.rooms.find((r) => String(r._id) === roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

    room.basePrice = Number(basePrice);
    await hotel.save();

    const dynamicPrice = Math.round(room.basePrice * 1.12);
    return res.json({
      success: true,
      message: 'Room price updated successfully.',
      room: {
        _id: room._id,
        hotelId: hotel._id,
        hotelName: hotel.name,
        roomNumber: room.roomNumber,
        basePrice: room.basePrice,
        dynamicPrice,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Unable to update room price.' });
  }
};

// =============================================================================
// REAL DATABASE ANALYTICS
// =============================================================================

export const getAdminAnalytics = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const paidBookings = await Booking.find({ paymentStatus: 'Paid', bookingStatus: { $ne: 'Cancelled' } }).lean();
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const avgBookingValue = paidBookings.length ? Math.round(totalRevenue / paidBookings.length) : 0;

    const hotels = await Hotel.find().lean();
    let totalRooms = 0;
    let availableRooms = 0;
    const roomTypeCounts = { Single: 0, Double: 0, Suite: 0, Deluxe: 0 };

    hotels.forEach((h) => {
      if (h.rooms && h.rooms.length) {
        totalRooms += h.rooms.length;
        h.rooms.forEach((r) => {
          if (r.isAvailable !== false) availableRooms++;
          if (roomTypeCounts[r.type] !== undefined) {
            roomTypeCounts[r.type]++;
          }
        });
      }
    });

    const occupiedRooms = totalRooms - availableRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const statusCounts = await Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]);

    const bookingTrend = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 14 },
    ]);

    const formattedTrend = bookingTrend.map((t) => ({
      date: t._id,
      name: new Date(t._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      bookings: t.bookings,
      revenue: t.revenue,
    }));

    const topHotels = await Booking.aggregate([
      {
        $group: {
          _id: '$hotelSnapshot.name',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
    ]);

    return res.json({
      success: true,
      analytics: {
        totalBookings,
        totalRevenue,
        avgBookingValue,
        totalHotels: hotels.length,
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate,
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id || 'Unknown']: s.count }), {}),
        bookingTrend: formattedTrend,
        topHotels: topHotels.map((h) => ({ name: h._id || 'Hotel Stay', bookings: h.bookings, revenue: h.revenue })),
        roomTypes: Object.entries(roomTypeCounts).map(([type, count]) => ({ type, count })),
      },
    });
  } catch (err) {
    console.error('getAdminAnalytics error:', err);
    return res.status(500).json({ success: false, message: 'Unable to calculate analytics data.' });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const rawId = req.user?.id || req.user?._id;
    const user = await User.findById(rawId).select('-passwordHash -passwordResetHash');
    if (!user) return res.status(404).json({ success: false, message: 'Admin user not found.' });
    return res.json({ success: true, admin: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load admin profile.' });
  }
};

// =============================================================================
// LOGIN ACTIVITY & AUTH STATISTICS
// =============================================================================

export const getLoginActivity = async (req, res) => {
  try {
    const { search = '', method = '', status = '', date = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (method && ['EMAIL', 'MOBILE_OTP'].includes(method)) filter.loginMethod = method;
    if (status === 'SUCCESS' || status === 'FAILED') filter.status = status;
    if (status === 'ACTIVE') { filter.status = 'SUCCESS'; filter.logoutTime = null; filter.loginTime = { $gte: activeSince() }; }
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) { const start = new Date(`${date}T00:00:00.000Z`); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); filter.loginTime = { $gte: start, $lt: end }; }
    if (search.trim()) { const pattern = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = ['name', 'email', 'phone'].map((field) => ({ [field]: { $regex: pattern, $options: 'i' } })); }
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100); const safePage = Math.max(Number(page) || 1, 1);
    const [data, total] = await Promise.all([LoginActivity.find(filter).sort({ loginTime: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).select('name email phone loginMethod loginTime logoutTime status').lean(), LoginActivity.countDocuments(filter)]);
    return res.json({ success: true, data, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch { return res.status(500).json({ success: false, message: 'Unable to load login activity.' }); }
};

export const getActiveUsers = async (_req, res) => {
  try {
    const active = await LoginActivity.aggregate([{ $match: { status: 'SUCCESS', logoutTime: null, loginTime: { $gte: activeSince() } } }, { $group: { _id: '$userId' } }, { $count: 'count' }]);
    return res.json({ success: true, activeUsers: active[0]?.count || 0, activeSessionTimeoutMinutes: Number(process.env.ACTIVE_SESSION_TIMEOUT_MINUTES || 30) });
  } catch { return res.status(500).json({ success: false, message: 'Unable to load active users.' }); }
};

export const getLoginStatistics = async (_req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const rows = await LoginActivity.aggregate([{ $match: { loginTime: { $gte: start } } }, { $group: { _id: { method: '$loginMethod', status: '$status' }, count: { $sum: 1 } } }]);
    const summary = { totalLoginsToday: 0, emailLoginsToday: 0, mobileOtpLoginsToday: 0, failedAttemptsToday: 0 };
    rows.forEach(({ _id, count }) => { if (_id.status === 'SUCCESS') { summary.totalLoginsToday += count; if (_id.method === 'EMAIL') summary.emailLoginsToday += count; if (_id.method === 'MOBILE_OTP') summary.mobileOtpLoginsToday += count; } else summary.failedAttemptsToday += count; });
    return res.json({ success: true, ...summary });
  } catch { return res.status(500).json({ success: false, message: 'Unable to load login statistics.' }); }
};

export const getDailyLoginStatistics = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90); const start = new Date(); start.setDate(start.getDate() - (days - 1)); start.setHours(0, 0, 0, 0);
    const data = await LoginActivity.aggregate([{ $match: { loginTime: { $gte: start }, status: 'SUCCESS' } }, { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } }, method: '$loginMethod' }, count: { $sum: 1 } } }, { $sort: { '_id.date': 1 } }]);
    return res.json({ success: true, data });
  } catch { return res.status(500).json({ success: false, message: 'Unable to load login trends.' }); }
};
