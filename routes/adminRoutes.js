import { Router } from 'express';
import {
  getActiveUsers,
  getDailyLoginStatistics,
  getLoginActivity,
  getLoginStatistics,
  getOverviewStats,
  getAdminHotels,
  createAdminHotel,
  getAdminUsers,
  getAdminRooms,
  createAdminRoom,
  getAdminBookings,
  getAdminPricing,
} from '../controllers/adminController.js';
import { isAdmin, isAuthenticated } from '../middleware/auth.js';

const router = Router();
router.use(isAuthenticated, isAdmin);

// Live Dashboard Data Endpoints
router.get('/overview', getOverviewStats);
router.get('/hotels', getAdminHotels);
router.post('/hotels', createAdminHotel);
router.get('/users', getAdminUsers);
router.get('/rooms', getAdminRooms);
router.post('/rooms', createAdminRoom);
router.get('/bookings', getAdminBookings);
router.get('/pricing', getAdminPricing);

// Login Activity & Authentication Analytics Endpoints
router.get('/login-activity', getLoginActivity);
router.get('/active-users', getActiveUsers);
router.get('/login-statistics', getLoginStatistics);
router.get('/login-statistics/daily', getDailyLoginStatistics);

export default router;
