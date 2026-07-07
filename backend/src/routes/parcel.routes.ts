import { Router } from 'express';
import { estimateParcel, createParcel, getParcelStatus, verifyOTP, cancelParcel, getParcelReceipt, rateParcel, getParcelHistory } from '../controllers/parcel.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/estimate', authenticate, estimateParcel);
router.post('/create', authenticate, createParcel);
router.get('/history', authenticate, getParcelHistory);
router.get('/:id/status', authenticate, getParcelStatus);
router.get('/:id/receipt', authenticate, getParcelReceipt);
router.post('/:id/verify-otp', authenticate, verifyOTP);
router.post('/:id/cancel', authenticate, cancelParcel);
router.post('/:id/rate', authenticate, rateParcel);

export default router;
