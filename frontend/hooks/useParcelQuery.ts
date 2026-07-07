import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParcelService, ParcelEstimateRequest, CreateParcelRequest, ParcelEstimateResponse } from '../services/parcelService';
import { useAppStore } from '../store/appStore';
import { parcelStatusConfigs, type ParcelStatus } from '../constants/enums';

export const useParcelEstimate = (params: ParcelEstimateRequest | null) =>
  useQuery<ParcelEstimateResponse>({
    queryKey: ['parcel-estimate', params],
    queryFn: () => ParcelService.getEstimate(params!),
    enabled: !!params && !!params.pickupLat && !!params.dropLat,
    staleTime: 1000 * 60,
  });

export const useParcelStatus = (parcelId: string | null) =>
  useQuery({
    queryKey: ['parcel-status', parcelId],
    queryFn: () => ParcelService.getStatus(parcelId!),
    enabled: !!parcelId,
    refetchInterval: (query) => {
      const status = query.state.data?.status as ParcelStatus | undefined;
      if (!status || parcelStatusConfigs[status]?.isTerminal) return false;
      return 8000;
    },
  });

export const useParcelHistory = (page = 1) =>
  useQuery({
    queryKey: ['parcel-history', page],
    queryFn: () => ParcelService.getHistory(page),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateParcel = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateParcelRequest) => ParcelService.createParcel(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parcel-history'] });
      qc.invalidateQueries({ queryKey: ['active-parcel-check'] });
      showToast({ type: 'success', message: 'Parcel pickup requested!' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to create parcel request' }),
  });
};

export const useVerifyParcelOTP = () => {
  const { showToast } = useAppStore();
  return useMutation({
    mutationFn: ({ parcelId, otp }: { parcelId: string; otp: string }) =>
      ParcelService.verifyOTP(parcelId, otp),
    onSuccess: () => showToast({ type: 'success', message: 'Delivery confirmed!' }),
    onError: () => showToast({ type: 'error', message: 'Invalid OTP' }),
  });
};

export const useCancelParcel = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (parcelId: string) => ParcelService.cancelParcel(parcelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parcel-history'] });
      qc.invalidateQueries({ queryKey: ['active-parcel-check'] });
      showToast({ type: 'info', message: 'Parcel cancelled' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to cancel parcel. Please try again.' }),
  });
};
