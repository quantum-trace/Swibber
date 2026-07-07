import { apiClient } from '../api/client';
import { Config } from '../constants/config';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler?: (response: RazorpayResponse) => void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

export const PaymentService = {
  async createOrder(serviceType: string, referenceId: string, amount: number): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post('/payment/create-order', { serviceType, referenceId, amount });
    return data.data;
  },

  async createRidePaymentOrder(rideId: string, amount: number) {
    return PaymentService.createOrder('ride', rideId, amount);
  },

  async createFoodPaymentOrder(orderId: string, amount: number) {
    return PaymentService.createOrder('food', orderId, amount);
  },

  async createParcelPaymentOrder(parcelId: string, amount: number) {
    return PaymentService.createOrder('parcel', parcelId, amount);
  },

  async verifyPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    serviceType: 'ride' | 'food' | 'parcel';
    referenceId: string;
  }) {
    const { data } = await apiClient.post('/payment/verify', params);
    return data;
  },

  async createMembershipOrder(tier: string, amount: number): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post('/payment/membership/create-order', { tier, amount });
    return data.data;
  },

  async verifyMembershipPayment(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    tier: string;
  }) {
    const { data } = await apiClient.post('/payment/membership/verify', params);
    return data;
  },

  buildRazorpayOptions(params: {
    orderId: string;
    amount: number;
    name?: string;
    email?: string;
    phone?: string;
    description?: string;
    onSuccess: (response: RazorpayResponse) => void;
  }): RazorpayOptions {
    return {
      key: Config.RAZORPAY_KEY_ID,
      amount: params.amount * 100,
      currency: 'INR',
      name: 'Swibber',
      description: params.description ?? 'Payment',
      order_id: params.orderId,
      prefill: { name: params.name, email: params.email, contact: params.phone },
      theme: { color: '#4C35E8' },
      handler: params.onSuccess,
    };
  },
};
