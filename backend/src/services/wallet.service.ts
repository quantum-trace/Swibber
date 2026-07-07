import mongoose from 'mongoose';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/errors';

export const getOrCreateWallet = async (userId: mongoose.Types.ObjectId | string) => {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) wallet = await Wallet.create({ userId });
  return wallet;
};

export const creditWallet = async (
  userId: mongoose.Types.ObjectId | string,
  amount: number,
  description: string,
  meta?: {
    referenceId?: string;
    referenceType?: 'ride' | 'food_order' | 'parcel' | 'wallet_recharge' | 'withdrawal' | 'cashback';
    type?: 'credit' | 'cashback' | 'refund';
    razorpayPaymentId?: string;
  },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new AppError('Wallet not found', 404);

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    await wallet.save({ session });

    await Transaction.create(
      [
        {
          userId,
          walletId: wallet._id,
          type: meta?.type ?? 'credit',
          amount,
          description,
          referenceId: meta?.referenceId,
          referenceType: meta?.referenceType,
          balanceBefore,
          balanceAfter: wallet.balance,
          status: 'completed',
          razorpayPaymentId: meta?.razorpayPaymentId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return wallet;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const debitWallet = async (
  userId: mongoose.Types.ObjectId | string,
  amount: number,
  description: string,
  meta?: {
    referenceId?: string;
    referenceType?: 'ride' | 'food_order' | 'parcel' | 'wallet_recharge' | 'withdrawal' | 'cashback';
  },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new AppError('Wallet not found', 404);
    if (wallet.balance < amount) throw new AppError('Insufficient wallet balance', 400);

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save({ session });

    await Transaction.create(
      [
        {
          userId,
          walletId: wallet._id,
          type: 'debit',
          amount,
          description,
          referenceId: meta?.referenceId,
          referenceType: meta?.referenceType,
          balanceBefore,
          balanceAfter: wallet.balance,
          status: 'completed',
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return wallet;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
