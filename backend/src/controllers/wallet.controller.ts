import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { getOrCreateWallet, debitWallet } from '../services/wallet.service';
import { createRazorpayOrder } from '../services/razorpay.service';
import { createNotification } from '../services/notification.service';
import { paginate, formatPaginatedResponse } from '../utils/helpers';
import { AppError } from '../utils/errors';
import mongoose from 'mongoose';

export const getBalance = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wallet = await getOrCreateWallet(req.user!.id);
    res.json({ success: true, data: { balance: wallet.balance, currency: wallet.currency } });
  } catch (err) { next(err); }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? 1));
    const limit = parseInt(String(req.query.limit ?? 20));
    const { skip } = paginate(page, limit);
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (req.query.type) filter.type = req.query.type;
    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);
    res.json({ success: true, ...formatPaginatedResponse(transactions, total, page, limit) });
  } catch (err) { next(err); }
};

export const initiateAddMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount } = req.body;
    if (amount < 10) { next(new AppError('Minimum add amount is ₹10', 400)); return; }
    const order = await createRazorpayOrder(amount, 'INR', `wallet_${req.user!.id}_${Date.now()}`, { purpose: 'wallet_recharge', userId: req.user!.id });
    res.json({ success: true, data: { razorpayOrderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID } });
  } catch (err) { next(err); }
};

export const confirmAddMoney = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;
    const { verifyRazorpaySignature } = await import('../services/razorpay.service');
    const valid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) { next(new AppError('Payment verification failed', 400)); return; }

    const { creditWallet } = await import('../services/wallet.service');
    const wallet = await creditWallet(req.user!.id, amount, 'Wallet recharge via Razorpay', {
      referenceType: 'wallet_recharge',
      razorpayPaymentId,
    });

    await createNotification({
      userId: new mongoose.Types.ObjectId(req.user!.id),
      type: 'payment',
      title: 'Money Added',
      body: `₹${amount} added to your Swibber Wallet`,
      data: { amount: String(amount) },
    });

    res.json({ success: true, data: { balance: wallet.balance } });
  } catch (err) { next(err); }
};

export const withdraw = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, bankDetails } = req.body;
    if (amount < 100) { next(new AppError('Minimum withdrawal is ₹100', 400)); return; }
    const wallet = await debitWallet(req.user!.id, amount, 'Wallet withdrawal', { referenceType: 'withdrawal' });
    await createNotification({
      userId: new mongoose.Types.ObjectId(req.user!.id),
      type: 'payment',
      title: 'Withdrawal Initiated',
      body: `₹${amount} withdrawal request submitted`,
    });
    res.json({ success: true, data: { balance: wallet.balance, message: 'Withdrawal initiated. Will be credited in 3-5 business days.' } });
  } catch (err) { next(err); }
};
