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

// =============================================================================
// PRICING ADMIN
// =============================================================================

export const getAdminPricing = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const hotels = await Hotel.find().lean();
    const pricingList = [];

    hotels.forEach((h) => {
      if (h.rooms && h.rooms.length > 0) {
        h.rooms.forEach((r) => {
          const base = r.basePrice;
          const dynamic = Math.round(base * 1.12);
          pricingList.push({
            hotelId: h._id,
            hotel: h.name,
            room: r.type,
            base,
            demand: r.basePrice > 4000 ? 'High' : (r.basePrice > 2000 ? 'Medium' : 'Low'),
            occupancy: r.isAvailable ? 65 : 90,
            dynamic,
            status: 'Active',
          });
        });
      }
    });

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
