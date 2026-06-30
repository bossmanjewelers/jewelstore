import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as auth from '../controllers/authController';

const router = Router();

router.post('/login', auth.login);
router.post('/refresh', auth.refreshToken);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.getMe);
router.post('/change-password', authenticate, auth.changePassword);
router.post('/register', authenticate, authorize('ADMIN'), auth.register);

export default router;
