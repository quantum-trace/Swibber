import { Router } from 'express';
import {
  getAppConfig,
  updateAppVersionConfig,
  webhookUpdateAppVersion,
  getAuthProviderConfig,
  getPromotions,
  getFareConfig,
  upsertFareConfig,
  getParcelFareConfig,
  upsertParcelFareConfig,
  getEnumConfig,
} from '../controllers/config.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public / lightly-authenticated endpoints
router.get('/app',              getAppConfig);
router.put('/app/version',      authenticate, requireRole('admin'), updateAppVersionConfig);
router.post('/webhook/version', webhookUpdateAppVersion);
router.get('/auth',         getAuthProviderConfig);
router.get('/promotions',   getPromotions);
router.get('/enums',        getEnumConfig);

// Fare config — readable by all authenticated users, writable by admins only
router.get('/fare',         authenticate, getFareConfig);
router.put('/fare',         authenticate, requireRole('admin'), upsertFareConfig);
router.get('/fare/parcel',  authenticate, getParcelFareConfig);
router.put('/fare/parcel',  authenticate, requireRole('admin'), upsertParcelFareConfig);

export default router;
