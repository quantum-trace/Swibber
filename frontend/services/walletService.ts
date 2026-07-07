import { apiClient } from '../api/client';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit' | 'refund' | 'cashback';
  amount: number;
  description: string;
  referenceType?: string;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  createdAt: string;
}

export const WalletService = {
  async getBalance(): Promise<WalletBalance> {
    const { data } = await apiClient.get('/wallet/balance');
    return data.data;
  },

  async getTransactions(page = 1, type?: string): Promise<{ data: WalletTransaction[]; pagination: unknown }> {
    const { data } = await apiClient.get('/wallet/transactions', { params: { page, type } });
    return data;
  },

  async initiateAddMoney(amount: number): Promise<{ razorpayOrderId: string; amount: number; currency: string; keyId: string }> {
    const { data } = await apiClient.post('/wallet/add-money', { amount });
    return data.data;
  },

  async confirmAddMoney(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
  }): Promise<{ balance: number }> {
    const { data } = await apiClient.post('/wallet/add-money/confirm', params);
    return data.data;
  },

  async withdraw(amount: number, bankDetails?: unknown): Promise<{ balance: number; message: string }> {
    const { data } = await apiClient.post('/wallet/withdraw', { amount, bankDetails });
    return data.data;
  },
};
