import mongoose from 'mongoose';
import Hotel from '../models/Hotel.js';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Standard success response wrapper.
 */
const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, ...data });

/**
 * Standard error response wrapper.
 */
const error = (res, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

/**
 * Validate that a string is a valid Mongoose ObjectId.
 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// =============================================================================
// HOTEL CRUD
// =============================================================================

/**
 * POST /api/hotels
 * Create a new hotel.
 */
export const createHotel = async (req, res) => {
  try {
    const { name, location, rating, amenities, images, rooms } = req.body;

    // --- Basic validation ---------------------------------------------------
    if (!name || !location?.city || !location?.address) {
      return error(res, 'name, location.city, and location.address are required.', 400);
    }

    const hotel = await Hotel.create({
      name,
      location,
      rating,
      amenities,
      images,
      rooms: rooms || [],
    });

    return success(res, { hotel }, 201);
  } catch (err) {
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join('. '), 400);
    }
    return error(res, err.message);
  }
};

/**
 * GET /api/hotels
 * List hotels with optional query filters:
 *   city / location — case-insensitive partial match on location.city
 *   minPrice       — hotels with at least one room where basePrice >= value
 *   maxPrice       — hotels with at least one room where basePrice <= value
 *   rating         — hotels with rating >= value
 *   amenities      — comma-separated; hotels whose amenities[] contain ALL listed values
 *   sort           — price_asc | price_desc | rating_desc | rating_asc |
 *                    location_asc | location_desc | name_asc | name_desc
 *   page           — page number (default 1)
 *   limit          — results per page (default 20, max 100)
 */
export const getHotels = async (req, res) => {
  try {
    // Support both ?city= and ?location= for compatibility
    const cityParam = req.query.city || req.query.location || '';
    const { minPrice, maxPrice, rating, amenities, sort, page, limit } = req.query;

    const filter = {};

    if (cityParam.trim()) {
      filter['location.city'] = { $regex: cityParam.trim(), $options: 'i' };
    }

    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }

    if (amenities) {
      const list = amenities.split(',').map((a) => a.trim());
      filter.amenities = { $all: list };
    }

    if (minPrice || maxPrice) {
      filter.rooms = { $elemMatch: {} };
      if (minPrice) filter.rooms.$elemMatch.basePrice = { ...filter.rooms.$elemMatch.basePrice, $gte: Number(minPrice) };
      if (maxPrice) filter.rooms.$elemMatch.basePrice = { ...filter.rooms.$elemMatch.basePrice, $lte: Number(maxPrice) };
    }

    // --- Sort ---
    let sortObj = {};
    switch (sort) {
      case 'price_asc':   sortObj = { 'rooms.0.basePrice': 1 }; break;
      case 'price_desc':  sortObj = { 'rooms.0.basePrice': -1 }; break;
      case 'rating_asc':  sortObj = { rating: 1 }; break;
      case 'rating_desc': sortObj = { rating: -1 }; break;
      case 'location_asc':  sortObj = { 'location.city': 1 }; break;
      case 'location_desc': sortObj = { 'location.city': -1 }; break;
      case 'name_asc':  sortObj = { name: 1 }; break;
      case 'name_desc': sortObj = { name: -1 }; break;
      default: sortObj = { createdAt: -1 }; // recommended (newest first)
    }

    // --- Pagination ---
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip     = (pageNum - 1) * limitNum;

    const [hotels, total] = await Promise.all([
      Hotel.find(filter).sort(sortObj).skip(skip).limit(limitNum),
      Hotel.countDocuments(filter),
    ]);

    return success(res, {
      count:  hotels.length,
      total,
      page:   pageNum,
      pages:  Math.ceil(total / limitNum),
      hotels,
    });
  } catch (err) {
    return error(res, err.message);
  }
};


/**
 * GET /api/hotels/:hotelId
 * Get a single hotel by ID.
 */
export const getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidId(hotelId)) {
      return error(res, 'Invalid hotel ID format.', 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    return success(res, { hotel });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/hotels/:hotelId
 * Partial-update a hotel (top-level fields only — use room endpoints for rooms).
 */
export const updateHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidId(hotelId)) {
      return error(res, 'Invalid hotel ID format.', 400);
    }

    const hotel = await Hotel.findByIdAndUpdate(hotelId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    return success(res, { hotel });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join('. '), 400);
    }
    return error(res, err.message);
  }
};

/**
 * DELETE /api/hotels/:hotelId
 * Delete a hotel and all its rooms.
 */
export const deleteHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidId(hotelId)) {
      return error(res, 'Invalid hotel ID format.', 400);
    }

    const hotel = await Hotel.findByIdAndDelete(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    return success(res, { message: 'Hotel deleted successfully.' });
  } catch (err) {
    return error(res, err.message);
  }
};

// =============================================================================
// ROOM CRUD (nested under a hotel)
// =============================================================================

/**
 * POST /api/hotels/:hotelId/rooms
 * Add a room to a hotel.
 */
export const addRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;

    if (!isValidId(hotelId)) {
      return error(res, 'Invalid hotel ID format.', 400);
    }

    const { roomNumber, type, capacity, basePrice, amenities, images, isAvailable } = req.body;

    // --- Basic validation ---------------------------------------------------
    if (!roomNumber || !type || capacity == null || basePrice == null) {
      return error(res, 'roomNumber, type, capacity, and basePrice are required.', 400);
    }

    const validTypes = ['Single', 'Double', 'Suite', 'Deluxe'];
    if (!validTypes.includes(type)) {
      return error(
        res,
        `Invalid room type "${type}". Choose from: ${validTypes.join(', ')}`,
        400
      );
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    // Check for duplicate room number within the same hotel
    const duplicate = hotel.rooms.find((r) => r.roomNumber === roomNumber);
    if (duplicate) {
      return error(res, `Room number "${roomNumber}" already exists in this hotel.`, 409);
    }

    hotel.rooms.push({
      roomNumber,
      type,
      capacity,
      basePrice,
      amenities: amenities || [],
      images: images || [],
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    await hotel.save();

    const newRoom = hotel.rooms[hotel.rooms.length - 1];
    return success(res, { room: newRoom }, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join('. '), 400);
    }
    return error(res, err.message);
  }
};

/**
 * PUT /api/hotels/:hotelId/rooms/:roomId
 * Update a specific room inside a hotel.
 */
export const updateRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    if (!isValidId(hotelId) || !isValidId(roomId)) {
      return error(res, 'Invalid hotel or room ID format.', 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    const room = hotel.rooms.id(roomId);
    if (!room) {
      return error(res, 'Room not found.', 404);
    }

    // Validate type enum if being updated
    if (req.body.type) {
      const validTypes = ['Single', 'Double', 'Suite', 'Deluxe'];
      if (!validTypes.includes(req.body.type)) {
        return error(
          res,
          `Invalid room type "${req.body.type}". Choose from: ${validTypes.join(', ')}`,
          400
        );
      }
    }

    // Apply updates to the subdocument
    const updatableFields = ['roomNumber', 'type', 'capacity', 'basePrice', 'amenities', 'images', 'isAvailable'];
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    }

    await hotel.save();

    return success(res, { room });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return error(res, messages.join('. '), 400);
    }
    return error(res, err.message);
  }
};

/**
 * DELETE /api/hotels/:hotelId/rooms/:roomId
 * Remove a room from a hotel.
 */
export const deleteRoom = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    if (!isValidId(hotelId) || !isValidId(roomId)) {
      return error(res, 'Invalid hotel or room ID format.', 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    const room = hotel.rooms.id(roomId);
    if (!room) {
      return error(res, 'Room not found.', 404);
    }

    hotel.rooms.pull(roomId);
    await hotel.save();

    return success(res, { message: 'Room deleted successfully.' });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/hotels/:hotelId/rooms/:roomId/availability
 * Check availability of a specific room.
 *
 * STUB: Simply reads the isAvailable boolean.
 * TODO (Booking teammate): Extend this to check against actual booking records,
 *       date ranges, etc. The current implementation just returns the flag value.
 */
export const checkAvailability = async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    if (!isValidId(hotelId) || !isValidId(roomId)) {
      return error(res, 'Invalid hotel or room ID format.', 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return error(res, 'Hotel not found.', 404);
    }

    const room = hotel.rooms.id(roomId);
    if (!room) {
      return error(res, 'Room not found.', 404);
    }

    return success(res, {
      hotelId,
      roomId,
      roomNumber: room.roomNumber,
      type: room.type,
      isAvailable: room.isAvailable,
    });
  } catch (err) {
    return error(res, err.message);
  }
};
