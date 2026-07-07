import { Router } from 'express';
import {
  getRestaurants, getRestaurantDetail, createFoodOrder,
  getOrderStatus, cancelFoodOrder, getFoodOrderReceipt,
  rateOrder, applyCoupon, getOrderHistory,
} from '../controllers/food.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/restaurants', authenticate, getRestaurants);
router.get('/restaurants/:id', authenticate, getRestaurantDetail);
router.get('/restaurants/:id/menu', authenticate, getRestaurantDetail);
router.post('/orders', authenticate, createFoodOrder);
router.get('/orders/history', authenticate, getOrderHistory);
router.get('/orders/:id/status', authenticate, getOrderStatus);
router.get('/orders/:id/receipt', authenticate, getFoodOrderReceipt);
router.post('/orders/:id/cancel', authenticate, cancelFoodOrder);
router.post('/orders/:id/rate', authenticate, rateOrder);
router.post('/coupon/apply', authenticate, applyCoupon);

export default router;
