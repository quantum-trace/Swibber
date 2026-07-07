import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletService } from '../services/walletService';
import { useAppStore } from '../store/appStore';

export const useWalletBalance = () =>
  useQuery({
    queryKey: ['wallet-balance'],
    queryFn: WalletService.getBalance,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

export const useWalletTransactions = (page = 1, type?: string) =>
  useQuery({
    queryKey: ['wallet-transactions', page, type],
    queryFn: () => WalletService.getTransactions(page, type),
    staleTime: 1000 * 60 * 2,
  });

export const useInitiateAddMoney = () => {
  const { showToast } = useAppStore();
  return useMutation({
    mutationFn: (amount: number) => WalletService.initiateAddMoney(amount),
    onError: () => showToast({ type: 'error', message: 'Failed to initiate payment' }),
  });
};

export const useConfirmAddMoney = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: Parameters<typeof WalletService.confirmAddMoney>[0]) =>
      WalletService.confirmAddMoney(params),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      showToast({ type: 'success', message: `Money added! New balance: ₹${data.balance}` });
    },
    onError: () => showToast({ type: 'error', message: 'Payment verification failed' }),
  });
};

export const useWithdraw = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, bankDetails }: { amount: number; bankDetails?: unknown }) =>
      WalletService.withdraw(amount, bankDetails),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balance'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      showToast({ type: 'success', message: 'Withdrawal initiated' });
    },
    onError: () => showToast({ type: 'error', message: 'Withdrawal failed. Check your balance.' }),
  });
};
