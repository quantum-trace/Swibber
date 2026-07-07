import { Router } from 'express';
import { firebaseAuth, refreshToken, logout, getMe, getAuthConfig } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/firebase', authRateLimit, firebaseAuth);
router.post('/refresh', authRateLimit, refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
