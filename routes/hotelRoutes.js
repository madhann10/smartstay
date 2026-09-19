import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../middleware/auth.js';
import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  addRoom,
  updateRoom,
  deleteRoom,
  checkAvailability,
} from '../controllers/hotelController.js';

const router = Router();

// =============================================================================
// Hotel routes
// =============================================================================

// Public
router.get('/', getHotels);
router.get('/:hotelId', getHotelById);

// Admin-only
router.post('/', isAuthenticated, isAdmin, createHotel);
router.put('/:hotelId', isAuthenticated, isAdmin, updateHotel);
router.delete('/:hotelId', isAuthenticated, isAdmin, deleteHotel);

// =============================================================================
// Room routes (nested under a hotel)
// =============================================================================

// Public
router.get('/:hotelId/rooms/:roomId/availability', checkAvailability);

// Admin-only
router.post('/:hotelId/rooms', isAuthenticated, isAdmin, addRoom);
router.put('/:hotelId/rooms/:roomId', isAuthenticated, isAdmin, updateRoom);
router.delete('/:hotelId/rooms/:roomId', isAuthenticated, isAdmin, deleteRoom);

export default router;
