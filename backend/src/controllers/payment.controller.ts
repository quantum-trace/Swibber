import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.service';
import { Payment, type PaymentEntityType } from '../models/Payment';
import { Ride } from '../models/Ride';
import { FoodOrder } from '../models/FoodOrder';
import { Parcel } from '../models/Parcel';
import { User } from '../models/User';
import { createNotification } from '../services/notification.service';
import { PaymentStatusEnum, MembershipTierEnum, membershipTierConfigs } from '../types/enums';
import { AppError } from '../utils/errors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

type ServiceType = 'ride' | 'food' | 'parcel';
const orderModels: Record<ServiceType, typeof Ride | typeof FoodOrder | typeof Parcel> = {
  ride: Ride,
  food: FoodOrder,
  parcel: Parcel,
};

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceType, referenceId, amount } = req.body as {
      serviceType: PaymentEntityType;
      referenceId: string;
      amount: number;
    };

    if (!serviceType || !referenceId || !amount) {
      next(new AppError('serviceType, referenceId and amount are required', 400));
      return;
    }
    if (amount < 1) {
      next(new AppError('Amount must be at least ₹1', 400));
      return;
    }

    const receipt = `rcpt_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
    const notes: Record<string, string> = {
      serviceType,
      referenceId,
      userId: req.user!.id,
    };

    const order = await createRazorpayOrder(amount, 'INR', receipt, notes);

    await Payment.create({
      userId:          new mongoose.Types.ObjectId(req.user!.id),
      razorpayOrderId: order.id,
      amount,
      currency:        order.currency,
      status:          PaymentStatusEnum.PENDING,
      entityType:      serviceType,
      entityId:        referenceId,
      receipt,
      notes,
    });

    res.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        receipt,
      },
    });
  } catch (err) { next(err); }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, serviceType, referenceId } = req.body as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      serviceType: ServiceType;
      referenceId: string;
    };

    const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) { next(new AppError('Payment signature invalid', 400)); return; }

    const paymentRecord = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: PaymentStatusEnum.PAID },
      { new: true },
    );

    const Model = orderModels[serviceType];
    if (Model) {
      await (Model as typeof Ride).findByIdAndUpdate(referenceId, {
        paymentStatus: 'paid',
        razorpayPaymentId,
      });
    }

    // Award reward points: 1 pt per ₹10 spent on billable services
    if (paymentRecord && ['ride', 'food', 'parcel'].includes(serviceType)) {
      const pointsEarned = Math.floor(paymentRecord.amount / 10);
      if (pointsEarned > 0) {
        const updatedUser = await User.findByIdAndUpdate(
          req.user!.id,
          { $inc: { rewardPoints: pointsEarned } },
          { new: true, select: 'rewardPoints membershipTier' },
        ).lean();

        // Auto-upgrade to the highest tier the user qualifies for (only upward)
        if (updatedUser) {
          const tierOrder: Record<string, number> = { bronze: 0, gold: 1, platinum: 2 };
          const currentTierRank = tierOrder[updatedUser.membershipTier] ?? 0;
          let bestTier: string | null = null;

          for (const [tierKey, tierCfg] of Object.entries(membershipTierConfigs)) {
            const rank = tierOrder[tierKey] ?? 0;
            if (rank > currentTierRank && updatedUser.rewardPoints >= tierCfg.pointsRequired) {
              if (!bestTier || rank > (tierOrder[bestTier] ?? 0)) bestTier = tierKey;
            }
          }

          if (bestTier) {
            await User.findByIdAndUpdate(req.user!.id, {
              membershipTier:      bestTier,
              membershipExpiresAt: null,
            });
          }
        }
      }
    }

    await createNotification({
      userId:        new mongoose.Types.ObjectId(req.user!.id),
      type:          'payment',
      title:         'Payment Successful',
      body:          `Your ${serviceType} payment was successful`,
      data:          { serviceType, referenceId, paymentId: razorpayPaymentId },
      referenceId,
      referenceType: serviceType,
    });

    res.json({ success: true, message: 'Payment verified' });
  } catch (err) { next(err); }
};

export const getPaymentHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page  = parseInt(String(req.query.page  ?? 1));
    const limit = parseInt(String(req.query.limit ?? 20));
    const skip  = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ userId: req.user!.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments({ userId: req.user!.id }),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

export const createMembershipOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tier } = req.body as { tier: string };
    const tierCfg = membershipTierConfigs[tier as keyof typeof membershipTierConfigs];
    if (!tierCfg || tierCfg.monthlyPrice === 0) {
      next(new AppError('Invalid or free membership tier', 400)); return;
    }

    const receipt = `mbr_${uuidv4().replace(/-/g, '').substring(0, 20)}`;
    const notes: Record<string, string> = { tier, userId: req.user!.id, type: 'membership' };

    const order = await createRazorpayOrder(tierCfg.monthlyPrice, 'INR', receipt, notes);

    await Payment.create({
      userId:          new mongoose.Types.ObjectId(req.user!.id),
      razorpayOrderId: order.id,
      amount:          tierCfg.monthlyPrice,
      currency:        'INR',
      status:          PaymentStatusEnum.PENDING,
      entityType:      'membership' as PaymentEntityType,
      entityId:        tier,
      receipt,
      notes,
    });

    res.json({ success: true, data: { orderId: order.id, amount: tierCfg.monthlyPrice, currency: 'INR', receipt } });
  } catch (err) { next(err); }
};

export const verifyMembershipPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, tier } = req.body as {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      tier: string;
    };

    const tierCfg = membershipTierConfigs[tier as keyof typeof membershipTierConfigs];
    if (!tierCfg) { next(new AppError('Invalid tier', 400)); return; }

    const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) { next(new AppError('Payment signature invalid', 400)); return; }

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: PaymentStatusEnum.PAID },
    );

    // Membership expires in 30 days from purchase
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await User.findByIdAndUpdate(req.user!.id, {
      membershipTier:       tier,
      membershipExpiresAt:  expiresAt,
      membershipPurchasedAt: new Date(),
    });

    await createNotification({
      userId:        new mongoose.Types.ObjectId(req.user!.id),
      type:          'payment',
      title:         `${tierCfg.alias} Activated!`,
      body:          `Your ${tierCfg.alias} membership is now active. Enjoy your benefits!`,
      data:          { tier, expiresAt: expiresAt.toISOString() },
      referenceId:   req.user!.id,
      referenceType: 'membership' as any,
    });

    res.json({ success: true, message: 'Membership upgraded', data: { tier, expiresAt } });
  } catch (err) { next(err); }
};

export const razorpayWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body      = JSON.stringify((req as unknown as AuthenticatedRequest).body);
    const signature = (req as unknown as AuthenticatedRequest).headers['x-razorpay-signature'] as string;
    const crypto    = await import('crypto');
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(body).digest('hex');

    if (expected !== signature) {
      (res as Response).status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = (req as unknown as AuthenticatedRequest).body;
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { razorpayPaymentId: payment.id, status: PaymentStatusEnum.PAID },
        );
      }
    }

    (res as Response).json({ received: true });
  } catch (err) { next(err); }
};
