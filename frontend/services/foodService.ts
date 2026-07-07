import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';
import type { CuisineType, PaymentMethod } from '../constants/enums';

export interface RestaurantSummary {
  id: string;
  name: string;
  cuisine: CuisineType;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  distance: string;
  imageEmoji: string;
  offers: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isPopular: boolean;
  imageEmoji: string;
  addons: { id: string; name: string; price: number }[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addons: { id: string; name: string; price: number }[];
}

export interface CreateOrderRequest {
  restaurantId: string;
  items: CartItem[];
  addressId: string;
  paymentMethod: PaymentMethod;
  deliveryInstructions?: string;
  couponCode?: string;
}

export const FoodService = {
  async getRestaurants(filters?: { cuisine?: CuisineType; search?: string }): Promise<RestaurantSummary[]> {
    const { data } = await apiClient.get(Endpoints.FOOD.RESTAURANTS, { params: filters });
    const arr = Array.isArray(data) ? data : (data?.data ?? []);
    return arr as RestaurantSummary[];
  },

  async getRestaurantDetail(id: string): Promise<RestaurantSummary & { menu: MenuItem[] }> {
    const { data } = await apiClient.get(Endpoints.FOOD.RESTAURANT_DETAIL(id));
    return (data?.data ?? data) as RestaurantSummary & { menu: MenuItem[] };
  },

  async createOrder(payload: CreateOrderRequest): Promise<{ orderId: string }> {
    const { data } = await apiClient.post(Endpoints.FOOD.CREATE_ORDER, payload);
    return data;
  },

  async getOrderStatus(orderId: string): Promise<{ status: string; eta?: number; riderLat?: number; riderLng?: number }> {
    const { data } = await apiClient.get(Endpoints.FOOD.ORDER_STATUS(orderId));
    return (data?.data ?? data) as { status: string; eta?: number; riderLat?: number; riderLng?: number };
  },

  async cancelOrder(orderId: string): Promise<void> {
    await apiClient.post(Endpoints.FOOD.CANCEL_ORDER(orderId));
  },

  async rateOrder(orderId: string, restaurantRating: number, riderRating: number, comment?: string): Promise<void> {
    await apiClient.post(Endpoints.FOOD.RATE_ORDER(orderId), { restaurantRating, riderRating, comment });
  },

  async applyCoupon(couponCode: string, cartTotal: number): Promise<{ discount: number; finalAmount: number }> {
    const { data } = await apiClient.post(Endpoints.FOOD.APPLY_COUPON, { couponCode, cartTotal });
    return data;
  },

  async getOrderHistory(page = 1): Promise<any[]> {
    const { data } = await apiClient.get(Endpoints.FOOD.ORDER_HISTORY, { params: { page } });
    return data?.data ?? data ?? [];
  },
};
