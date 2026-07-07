import { useState } from 'react';
import { PaymentService, type RazorpayResponse } from '../services/paymentService';
import { useAppStore } from '../store/appStore';
import { useDialog } from '../context/DialogContext';

type EntityType = 'ride' | 'food' | 'parcel' | 'wallet';

interface OpenPaymentParams {
  entityType: EntityType;
  entityId: string;
  amount: number;
  description?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (response: RazorpayResponse) => void;
  onFailure?: (error: any) => void;
}

let RazorpayCheckout: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  RazorpayCheckout = require('react-native-razorpay').default;
} catch {
  RazorpayCheckout = null;
}

export function usePayment() {
  const [isLoading, setIsLoading]     = useState(false);
  const { showToast }                  = useAppStore();
  const { showDialog }                 = useDialog();

  const openPayment = async (params: OpenPaymentParams) => {
    if (!RazorpayCheckout) {
      showDialog({
        title:   'Payment SDK Not Installed',
        message: 'Please run: npx expo install react-native-razorpay\n\nThen rebuild the app.',
        type:    'warning',
      });
      return;
    }

    setIsLoading(true);
    try {
      const order = await PaymentService.createOrder(params.entityType, params.entityId, params.amount);

      const options = PaymentService.buildRazorpayOptions({
        orderId:     order.orderId,
        amount:      order.amount / 100,
        description: params.description ?? `Payment for ${params.entityType}`,
        name:        params.userName,
        email:       params.userEmail,
        phone:       params.userPhone,
        onSuccess:   () => {},
      });

      const rzpData: RazorpayResponse = await RazorpayCheckout.open({
        ...options,
        order_id: order.orderId,
      });

      await PaymentService.verifyPayment({
        razorpayOrderId:   rzpData.razorpay_order_id,
        razorpayPaymentId: rzpData.razorpay_payment_id,
        razorpaySignature: rzpData.razorpay_signature,
        serviceType:       params.entityType as 'ride' | 'food' | 'parcel',
        referenceId:       params.entityId,
      });

      showToast({ type: 'success', message: 'Payment successful!' });
      params.onSuccess(rzpData);
    } catch (err: any) {
      const message = err?.description ?? err?.message ?? 'Payment failed';
      if (err?.code === 2) {
        showToast({ type: 'info', message: 'Payment cancelled' });
      } else {
        showToast({ type: 'error', message });
      }
      params.onFailure?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  return { openPayment, isLoading };
}
