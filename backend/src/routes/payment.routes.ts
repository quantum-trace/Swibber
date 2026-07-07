import { Router } from 'express';
import {
  createOrder, verifyPayment, getPaymentHistory, razorpayWebhook,
  createMembershipOrder, verifyMembershipPayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create-order',          authenticate, createOrder);
router.post('/verify',                authenticate, verifyPayment);
router.get('/history',                authenticate, getPaymentHistory);
router.post('/membership/create-order', authenticate, createMembershipOrder);
router.post('/membership/verify',       authenticate, verifyMembershipPayment);
router.post('/webhook',               razorpayWebhook as unknown as Parameters<typeof router.post>[1]);

export default router;
