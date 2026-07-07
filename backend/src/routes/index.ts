import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import rideRoutes from './ride.routes';
import foodRoutes from './food.routes';
import parcelRoutes from './parcel.routes';
import walletRoutes from './wallet.routes';
import paymentRoutes from './payment.routes';
import mapsRoutes from './maps.routes';
import notificationRoutes from './notification.routes';
import configRoutes from './config.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/ride', rideRoutes);
router.use('/food', foodRoutes);
router.use('/parcel', parcelRoutes);
router.use('/wallet', walletRoutes);
router.use('/payment', paymentRoutes);
router.use('/maps', mapsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/config', configRoutes);
router.use('/activity', activityRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString(), service: 'Swibber API' });
});

export default router;
