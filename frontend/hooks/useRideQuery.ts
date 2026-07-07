import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RideService, RideEstimateRequest, CreateRideRequest } from '../services/rideService';
import { useAppStore } from '../store/appStore';
import { useRideStore } from '../store/rideStore';

export const useRideEstimates = (params: RideEstimateRequest | null) =>
  useQuery({
    queryKey: ['ride-estimates', params],
    queryFn: () => RideService.getEstimates(params!),
    enabled: !!params && !!params.pickupLat && !!params.destinationLat,
    staleTime: 1000 * 60,
  });

export const useRideStatus = (rideId: string | null) =>
  useQuery({
    queryKey: ['ride-status', rideId],
    queryFn: () => RideService.getRideStatus(rideId!),
    enabled: !!rideId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || ['completed', 'cancelled'].includes(status)) return false;
      return 5000;
    },
  });

export const useRideHistory = (page = 1) =>
  useQuery({
    queryKey: ['ride-history', page],
    queryFn: () => RideService.getRideHistory(page),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateRide = () => {
  const { showToast } = useAppStore();
  const { setActiveRide } = useRideStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRideRequest) => RideService.createRide(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ride-history'] });
      qc.invalidateQueries({ queryKey: ['active-ride-check'] });
      showToast({ type: 'success', message: 'Ride booked! Looking for drivers...' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to book ride. Please try again.' }),
  });
};

export const useCancelRide = () => {
  const { showToast } = useAppStore();
  const { setActiveRide } = useRideStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ rideId, reason }: { rideId: string; reason?: string }) => RideService.cancelRide(rideId, reason),
    onSuccess: () => {
      setActiveRide(null);
      qc.invalidateQueries({ queryKey: ['ride-history'] });
      qc.invalidateQueries({ queryKey: ['active-ride-check'] });
      showToast({ type: 'info', message: 'Ride cancelled' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to cancel ride' }),
  });
};

export const useRateRide = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rideId, rating, feedback, tip }: { rideId: string; rating: number; feedback?: string; tip?: number }) =>
      RideService.rateRide(rideId, rating, feedback, tip),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-ride-check'] });
      showToast({ type: 'success', message: 'Thank you for your rating!' });
    },
  });
};
