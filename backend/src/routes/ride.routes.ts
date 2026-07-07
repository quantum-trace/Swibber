import { Router } from 'express';
import {
  estimateRide,
  createRide,
  getRideStatus,
  cancelRide,
  getRideReceipt,
  rateRide,
  getRideHistory,
  getNearbyDrivers,
  getCurrentSurge,
  getRideETA,
} from '../controllers/ride.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get( '/surge',           authenticate, getCurrentSurge);
router.get( '/eta',             authenticate, getRideETA);
router.post('/estimate',        authenticate, estimateRide);
router.post('/create',          authenticate, createRide);
router.get( '/history',         authenticate, getRideHistory);
router.get( '/nearby-drivers',  authenticate, getNearbyDrivers);
router.get( '/:id/status',      authenticate, getRideStatus);
router.get( '/:id/receipt',     authenticate, getRideReceipt);
router.post('/:id/cancel',      authenticate, cancelRide);
router.post('/:id/rate',        authenticate, rateRide);

export default router;
