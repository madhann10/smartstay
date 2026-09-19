import Hotel from '../models/Hotel.js';
import { spawn } from 'child_process';

export const predictPrice = (req, res) => {
  const {
    basePrice,
    demand,
    occupancy,
    weekend,
    season,
    leadDays,
    rating,
  } = req.body;

  // Check required fields
  if (
    basePrice === undefined ||
    demand === undefined ||
    occupancy === undefined ||
    weekend === undefined ||
    season === undefined ||
    leadDays === undefined ||
    rating === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: 'All pricing fields are required.',
    });
  }

  // Start Python program
  const python = spawn('python', [
    'ml/predict.py',
    basePrice,
    demand,
    occupancy,
    weekend,
    season,
    leadDays,
    rating,
  ]);

  let output = '';
  let errorOutput = '';

  // Receive Python output
  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Receive Python errors
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // When Python finishes
  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error:', errorOutput);

      return res.status(500).json({
        success: false,
        message: 'Price prediction failed.',
        error: errorOutput,
      });
    }

    const dynamicPrice = Number(output.trim());

    return res.json({
      success: true,
      basePrice: Number(basePrice),
      dynamicPrice,
    });
  });
};
export const predictRoomPrice = async (req, res) => {
  try {
    const { hotelId, roomNumber, checkInDate } = req.body;

    // Check required fields
    if (!hotelId || !roomNumber || !checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'hotelId, roomNumber and checkInDate are required.',
      });
    }

    // Find hotel
    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found.',
      });
    }

    // Find room
    const room = hotel.rooms.find(
      (r) => r.roomNumber === roomNumber
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found.',
      });
    }

    // -----------------------------------------
    // Calculate occupancy
    // -----------------------------------------

    const totalRooms = hotel.rooms.length;

    const availableRooms = hotel.rooms.filter(
      (r) => r.isAvailable
    ).length;

    const occupiedRooms = totalRooms - availableRooms;

    const occupancy =
      totalRooms > 0
        ? (occupiedRooms / totalRooms) * 100
        : 0;

    // -----------------------------------------
    // Calculate demand
    // -----------------------------------------

    // Temporary assumption:
    // demand = occupancy
    const demand = occupancy;

    // -----------------------------------------
    // Check selected check-in date
    // -----------------------------------------

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = new Date(checkInDate);

    if (Number.isNaN(checkIn.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in date.',
      });
    }

    checkIn.setHours(0, 0, 0, 0);

    // -----------------------------------------
    // Calculate lead days
    // -----------------------------------------

    const leadDays = Math.max(
      0,
      Math.ceil(
        (checkIn - today) / (1000 * 60 * 60 * 24)
      )
    );

    // -----------------------------------------
    // Check WEEKEND using check-in date
    // -----------------------------------------

    const checkInDay = checkIn.getDay();

    const weekend =
      checkInDay === 0 || checkInDay === 6
        ? 1
        : 0;

    // -----------------------------------------
    // Determine SEASON using check-in date
    // -----------------------------------------

    const month = checkIn.getMonth() + 1;

    let season;

    if ([4, 5, 6].includes(month)) {
      season = 2; // Peak season
    } else if ([11, 12, 1].includes(month)) {
      season = 1; // Normal season
    } else {
      season = 0; // Off-season
    }

    // -----------------------------------------
    // Run ML model
    // -----------------------------------------

    const python = spawn('python', [
      'ml/predict.py',
      room.basePrice,
      demand,
      occupancy,
      weekend,
      season,
      leadDays,
      hotel.rating,
    ]);

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python error:', errorOutput);

        return res.status(500).json({
          success: false,
          message: 'ML price prediction failed.',
        });
      }

      const dynamicPrice = Number(output.trim());

      return res.json({
        success: true,

        hotel: hotel.name,

        room: {
          roomNumber: room.roomNumber,
          type: room.type,
        },

        pricing: {
          basePrice: room.basePrice,
          dynamicPrice,
        },

        factors: {
          demand: Math.round(demand),
          occupancy: Math.round(occupancy),
          weekend,
          season,
          leadDays,
          rating: hotel.rating,
        },
      });
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
      error: error.message,
    });
  }
};