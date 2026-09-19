import mongoose from 'mongoose';

// =============================================================================
// Booking model
// =============================================================================
// INTEGRATION NOTES:
//   • This is a NEW model. It stores one booking per document.
//   • pricePerNight is fetched from Hotel.rooms[].basePrice by the backend
//     so the frontend cannot manipulate the price.
//   • invoiceNumber is generated on creation and never changes.
// =============================================================================

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    // Snapshot of room data at booking time (room could change later)
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    // Price snapshot (backend calculated — never trust frontend price)
    pricePerNight: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: [1, 'At least 1 guest required'],
      default: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'At least 1 night required'],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Paid',
    },
    paymentId: {
      type: String,
      trim: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: 'DEMO Payment',
    },
    // Snapshot of hotel/user info for invoice (in case hotel/user changes later)
    hotelSnapshot: {
      name: String,
      city: String,
      state: String,
      address: String,
    },
    customerSnapshot: {
      name: String,
      email: String,
      phone: String,
    },
    // Email & Invoice status tracking
    invoiceGenerated: {
      type: Boolean,
      default: true,
    },
    invoiceEmailed: {
      type: Boolean,
      default: false,
    },
    invoiceEmailSentAt: {
      type: Date,
    },
    emailDeliveryStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    emailErrorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ hotel: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
