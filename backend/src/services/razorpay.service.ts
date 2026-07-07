import Razorpay from 'razorpay';
import crypto from 'crypto';

let instance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return instance;
};

export const createRazorpayOrder = async (
  amount: number,
  currency = 'INR',
  receipt: string,
  notes?: Record<string, string>,
): Promise<{ id: string; amount: number; currency: string; receipt: string }> => {
  const rz = getRazorpay();
  const order = await rz.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });
  return {
    id: order.id,
    amount: order.amount as number,
    currency: order.currency,
    receipt: order.receipt ?? receipt,
  };
};

export const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string,
): boolean => {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');
  return expected === signature;
};

export const fetchPayment = async (paymentId: string) => {
  const rz = getRazorpay();
  return rz.payments.fetch(paymentId);
};

export const refundPayment = async (paymentId: string, amount?: number) => {
  const rz = getRazorpay();
  return rz.payments.refund(paymentId, amount ? { amount: Math.round(amount * 100) } : {});
};
