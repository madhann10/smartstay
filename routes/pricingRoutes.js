import { Router } from 'express';
import {
  predictPrice,
  predictRoomPrice
} from '../controllers/pricingController.js';

const router = Router();

router.post('/predict', predictPrice);
router.post('/predict-room', predictRoomPrice);

export default router;