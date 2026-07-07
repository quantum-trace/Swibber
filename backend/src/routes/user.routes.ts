import { Router } from 'express';
import multer from 'multer';
import {
  getProfile, updateProfile, uploadAvatar,
  getAddresses, addAddress, updateAddress, deleteAddress,
  updateSettings, updateFcmToken,
  getMembershipStatus, claimMembershipByPoints,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.get('/addresses', authenticate, getAddresses);
router.post('/addresses', authenticate, addAddress);
router.put('/addresses/:id', authenticate, updateAddress);
router.delete('/addresses/:id', authenticate, deleteAddress);
router.put('/settings', authenticate, updateSettings);
router.post('/fcm-token', authenticate, updateFcmToken);
router.get('/membership', authenticate, getMembershipStatus);
router.post('/membership/claim', authenticate, claimMembershipByPoints);

export default router;
