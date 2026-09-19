import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  getInvoice,
  resendInvoice,
} from '../controllers/bookingController.js';

const router = Router();

// All booking routes require authentication
router.use(isAuthenticated);

router.get('/', getMyBookings);
router.post('/', createBooking);
router.get('/:bookingId', getBookingById);
router.get('/:bookingId/invoice', getInvoice);
router.post('/:bookingId/resend-invoice', resendInvoice);

export default router;
