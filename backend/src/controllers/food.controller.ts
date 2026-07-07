import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { FoodOrder } from '../models/FoodOrder';
import { Coupon } from '../models/Coupon';
import { createRazorpayOrder } from '../services/razorpay.service';
import { createNotification } from '../services/notification.service';
import { generateOTP, paginate, formatPaginatedResponse } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { getCache, setCache } from '../config/redis';
import { makeHistoryEntry } from '../utils/statusHistory';
import mongoose from 'mongoose';

export const getRestaurants = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { cuisine, search, page = 1, limit = 20 } = req.query;
    const p = parseInt(String(page));
    const l = parseInt(String(limit));
    const { skip } = paginate(p, l);

    const filter: Record<string, unknown> = { isActive: true };
    if (cuisine) filter.cuisine = { $in: [cuisine] };
    if (search) filter.$text = { $search: String(search) };

    const cacheKey = `restaurants:${JSON.stringify(filter)}:${p}:${l}`;
    const cached = await getCache<{ data: unknown[]; total: number }>(cacheKey);
    if (cached) {
      res.json({ success: true, ...formatPaginatedResponse(cached.data as [], cached.total, p, l) });
      return;
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort({ rating: -1, createdAt: -1 }).skip(skip).limit(l).lean(),
      Restaurant.countDocuments(filter),
    ]);

    const result = restaurants.map((r) => ({
      id: r._id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      deliveryTime: `${r.deliveryTimeMins}–${r.deliveryTimeMins + 15} min`,
      deliveryFee: r.deliveryFee,
      minimumOrder: r.minimumOrder,
      isOpen: r.isOpen,
      imageEmoji: r.imageEmoji,
      offers: r.offers,
    }));

    await setCache(cacheKey, { data: result, total }, 300);
    res.json({ success: true, ...formatPaginatedResponse(result, total, p, l) });
  } catch (err) { next(err); }
};

export const getRestaurantDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cacheKey = `restaurant:${req.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) { res.json({ success: true, data: cached }); return; }

    const [restaurant, menuItems] = await Promise.all([
      Restaurant.findById(req.params.id).lean(),
      MenuItem.find({ restaurantId: req.params.id, isAvailable: true }).lean(),
    ]);
    if (!restaurant) { next(new AppError('Restaurant not found', 404)); return; }

    const grouped = menuItems.reduce((acc: Record<string, unknown[]>, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const data = { ...restaurant, menu: grouped, menuItems };
    await setCache(cacheKey, data, 600);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const createFoodOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, items, addressId, deliveryAddress, deliveryLat, deliveryLng, paymentMethod, deliveryInstructions, couponCode } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isOpen) { next(new AppError('Restaurant is not available', 400)); return; }

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
      for (const addon of item.addons ?? []) subtotal += addon.price * item.quantity;
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        discount = coupon.type === 'percentage' ? Math.min(subtotal * (coupon.discount / 100), coupon.maxDiscount ?? Infinity) : coupon.discount;
        await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
      }
    }

    const deliveryFee = restaurant.deliveryFee;
    const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

    let razorpayOrderId: string | undefined;
    if (paymentMethod !== 'cash' && paymentMethod !== 'wallet') {
      const order = await createRazorpayOrder(totalAmount, 'INR', `food_${Date.now()}`);
      razorpayOrderId = order.id;
    }

    const foodOrder = await FoodOrder.create({
      userId: req.user!.id,
      restaurantId,
      items,
      deliveryAddress: deliveryAddress ?? 'User address',
      deliveryLat: deliveryLat ?? 0,
      deliveryLng: deliveryLng ?? 0,
      deliveryInstructions,
      subtotal,
      deliveryFee,
      discount,
      totalAmount,
      couponCode,
      paymentMethod,
      razorpayOrderId,
      otp: generateOTP(),
      estimatedDeliveryMins: restaurant.deliveryTimeMins,
      statusHistory: [makeHistoryEntry('pending', 'user')],
    });

    global.__io?.to(`restaurant:${restaurantId}`).emit('new_order', { orderId: foodOrder._id, items, totalAmount });

    await createNotification({
      userId: new mongoose.Types.ObjectId(req.user!.id),
      type: 'food_update',
      title: 'Order Placed!',
      body: `Your order from ${restaurant.name} has been placed`,
      data: { orderId: (foodOrder._id as unknown as string).toString() },
    });

    res.status(201).json({ success: true, data: { orderId: foodOrder._id, totalAmount, discount, razorpayOrderId } });
  } catch (err) { next(err); }
};

export const getOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await FoodOrder.findById(req.params.id).populate('restaurantId', 'name imageEmoji').populate('riderId', 'name phone currentLocation rating').lean();
    if (!order) { next(new AppError('Order not found', 404)); return; }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

const FOOD_CANCELLATION_FEE = 30; // ₹30 after restaurant acceptance

// Statuses after which cancellation is not allowed
const FOOD_BLOCK_CANCEL = new Set(['picked_up', 'on_the_way', 'delivered', 'cancelled', 'refunded']);
// Statuses that incur a fee (restaurant already accepted)
const FOOD_FEE_STATUSES = new Set(['confirmed', 'preparing']);

export const cancelFoodOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await FoodOrder.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!order) { next(new AppError('Order not found', 404)); return; }

    if (FOOD_BLOCK_CANCEL.has(order.status)) {
      next(new AppError('Order cannot be cancelled at this stage', 400));
      return;
    }

    const cancellationFee = FOOD_FEE_STATUSES.has(order.status) ? FOOD_CANCELLATION_FEE : 0;
    const now = new Date();

    order.status             = 'cancelled';
    order.cancellationReason = req.body.reason ?? 'user_cancelled';
    order.cancelledBy        = 'user';
    order.cancelledAt        = now;
    order.cancellationFee    = cancellationFee;
    order.statusHistory      = [
      ...(order.statusHistory ?? []),
      makeHistoryEntry('cancelled', 'user', req.body.reason),
    ];
    await order.save();

    global.__io?.to(`food:${order._id}`).emit('order_status_changed', {
      orderId:   (order._id as unknown as string).toString(),
      status:    'cancelled',
      timestamp: now.toISOString(),
    });

    await createNotification({
      userId: new mongoose.Types.ObjectId(req.user!.id),
      type:   'food_update',
      title:  'Order Cancelled',
      body:   cancellationFee > 0 ? `A cancellation fee of ₹${cancellationFee} has been charged` : 'Your order has been cancelled',
      data:   { orderId: (order._id as unknown as string).toString() },
    });

    res.json({ success: true, message: 'Order cancelled', data: { cancellationFee } });
  } catch (err) { next(err); }
};

export const getFoodOrderReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await FoodOrder.findOne({ _id: req.params.id, userId: req.user!.id })
      .populate('restaurantId', 'name imageEmoji cuisine deliveryFee')
      .populate('riderId', 'name phone vehicleNumber rating avatarUrl')
      .lean();
    if (!order) { next(new AppError('Order not found', 404)); return; }

    const o = order as any;
    res.json({
      success: true,
      data: {
        id:                   String(o._id),
        type:                 'food',
        status:               o.status,
        restaurant:           o.restaurantId ?? null,
        rider:                o.riderId ?? null,
        items:                o.items ?? [],
        deliveryAddress:      o.deliveryAddress,
        subtotal:             o.subtotal,
        deliveryFee:          o.deliveryFee,
        discount:             o.discount,
        totalAmount:          o.totalAmount,
        couponCode:           o.couponCode,
        paymentMethod:        o.paymentMethod,
        paymentStatus:        o.paymentStatus,
        estimatedDeliveryMins: o.estimatedDeliveryMins,
        statusHistory:        o.statusHistory ?? [],
        cancellationReason:   o.cancellationReason,
        cancelledBy:          o.cancelledBy,
        cancelledAt:          o.cancelledAt,
        cancellationFee:      o.cancellationFee,
        confirmedAt:          o.confirmedAt,
        preparedAt:           o.preparedAt,
        pickedUpAt:           o.pickedUpAt,
        deliveredAt:          o.deliveredAt,
        createdAt:            o.createdAt,
      },
    });
  } catch (err) { next(err); }
};

export const rateOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantRating, riderRating, comment } = req.body;
    const order = await FoodOrder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id, status: 'delivered' },
      { restaurantRating, riderRating, ratingComment: comment },
      { new: true },
    );
    if (!order) { next(new AppError('Order not found or not delivered', 404)); return; }
    if (restaurantRating) {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (restaurant) {
        restaurant.rating = parseFloat(((restaurant.rating * restaurant.totalRatings + restaurantRating) / (restaurant.totalRatings + 1)).toFixed(1));
        restaurant.totalRatings += 1;
        await restaurant.save();
      }
    }
    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) { next(err); }
};

export const applyCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { couponCode, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (!coupon) { next(new AppError('Invalid or expired coupon', 400)); return; }
    if (cartTotal < coupon.minOrderAmount) { next(new AppError(`Minimum order ₹${coupon.minOrderAmount} required`, 400)); return; }
    const discount = coupon.type === 'percentage' ? Math.min(cartTotal * (coupon.discount / 100), coupon.maxDiscount ?? Infinity) : coupon.discount;
    res.json({ success: true, data: { discount, finalAmount: Math.max(0, cartTotal - discount), couponCode: coupon.code } });
  } catch (err) { next(err); }
};

export const getOrderHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? 1));
    const limit = parseInt(String(req.query.limit ?? 10));
    const { skip } = paginate(page, limit);
    const [orders, total] = await Promise.all([
      FoodOrder.find({ userId: req.user!.id }).populate('restaurantId', 'name imageEmoji').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      FoodOrder.countDocuments({ userId: req.user!.id }),
    ]);
    res.json({ success: true, ...formatPaginatedResponse(orders, total, page, limit) });
  } catch (err) { next(err); }
};
