import { Router } from 'express';
import {
  getActiveUsers,
  getDailyLoginStatistics,
  getLoginActivity,
  getLoginStatistics,
  getOverviewStats,
  getAdminHotels,
  createAdminHotel,
  getAdminHotelById,
  updateAdminHotel,
  deleteAdminHotel,
  getAdminUsers,
  getAdminRooms,
  createAdminRoom,
  updateAdminRoom,
  deleteAdminRoom,
  getAdminBookings,
  getAdminBookingById,
  updateAdminBookingStatus,
  cancelAdminBooking,
  getAdminPricing,
  updateAdminRoomPrice,
  getAdminAnalytics,
  getAdminProfile,
} from '../controllers/adminController.js';
import { isAdmin, isAuthenticated } from '../middleware/auth.js';

const router = Router();
router.use(isAuthenticated, isAdmin);

// Live Dashboard Data Endpoints
router.get('/overview', getOverviewStats);
router.get('/profile', getAdminProfile);
router.get('/analytics', getAdminAnalytics);

// Hotels
router.get('/hotels', getAdminHotels);
router.post('/hotels', createAdminHotel);
router.get('/hotels/:id', getAdminHotelById);
router.put('/hotels/:id', updateAdminHotel);
router.delete('/hotels/:id', deleteAdminHotel);

// Users
router.get('/users', getAdminUsers);

// Rooms
router.get('/rooms', getAdminRooms);
router.post('/rooms', createAdminRoom);
router.put('/rooms/:hotelId/:roomId', updateAdminRoom);
router.delete('/rooms/:hotelId/:roomId', deleteAdminRoom);

// Bookings
router.get('/bookings', getAdminBookings);
router.get('/bookings/:id', getAdminBookingById);
router.put('/bookings/:id/status', updateAdminBookingStatus);
router.delete('/bookings/:id', cancelAdminBooking);

// Pricing
router.get('/pricing', getAdminPricing);
router.put('/pricing/:hotelId/:roomId', updateAdminRoomPrice);

// Login Activity & Authentication Analytics Endpoints
router.get('/login-activity', getLoginActivity);
router.get('/active-users', getActiveUsers);
router.get('/login-statistics', getLoginStatistics);
router.get('/login-statistics/daily', getDailyLoginStatistics);

export default router;

