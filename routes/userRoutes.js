import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/auth.js';
const router = Router();
router.get('/me', isAuthenticated, getMe);
router.patch('/me', isAuthenticated, updateMe);
export default router;
