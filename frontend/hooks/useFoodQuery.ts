import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { FoodService, CreateOrderRequest } from '../services/foodService';
import { useFoodStore } from '../store/foodStore';
import { useAppStore } from '../store/appStore';
import { orderStatusConfigs, type OrderStatus, type CuisineType } from '../constants/enums';

export const useRestaurants = (cuisine?: CuisineType | null, search?: string) =>
  useQuery({
    queryKey: ['restaurants', cuisine, search],
    queryFn: () => FoodService.getRestaurants({ cuisine: cuisine ?? undefined, search }),
    staleTime: 1000 * 60 * 5,
  });

export const useRestaurantDetail = (id: string | null) =>
  useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => FoodService.getRestaurantDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });

export const useFoodOrderStatus = (orderId: string | null) =>
  useQuery({
    queryKey: ['food-order-status', orderId],
    queryFn: () => FoodService.getOrderStatus(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.status as OrderStatus | undefined;
      if (!status || orderStatusConfigs[status]?.isTerminal) return false;
      return 8000;
    },
  });

export const useFoodOrderHistory = (page = 1) =>
  useQuery({
    queryKey: ['food-order-history', page],
    queryFn: () => FoodService.getOrderHistory(page),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateFoodOrder = () => {
  const { showToast } = useAppStore();
  const { setActiveOrderId } = useFoodStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => FoodService.createOrder(payload),
    onSuccess: (data) => {
      setActiveOrderId(data.orderId);
      qc.invalidateQueries({ queryKey: ['food-order-history'] });
      showToast({ type: 'success', message: 'Order placed successfully!' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to place order. Please try again.' }),
  });
};

export const useCancelFoodOrder = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => FoodService.cancelOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-order-history'] });
      showToast({ type: 'info', message: 'Order cancelled' });
    },
  });
};

export const useApplyCoupon = () => {
  const { showToast } = useAppStore();
  return useMutation({
    mutationFn: ({ couponCode, cartTotal }: { couponCode: string; cartTotal: number }) =>
      FoodService.applyCoupon(couponCode, cartTotal),
    onSuccess: (data) => showToast({ type: 'success', message: `Coupon applied! Saved ₹${data.discount}` }),
    onError: () => showToast({ type: 'error', message: 'Invalid or expired coupon' }),
  });
};

export const useRateFoodOrder = () => {
  const { showToast } = useAppStore();
  return useMutation({
    mutationFn: ({ orderId, restaurantRating, riderRating, comment }: { orderId: string; restaurantRating: number; riderRating: number; comment?: string }) =>
      FoodService.rateOrder(orderId, restaurantRating, riderRating, comment),
    onSuccess: () => showToast({ type: 'success', message: 'Thank you for your feedback!' }),
  });
};
