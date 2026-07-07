import { apiClient } from '../api/client';
import { Endpoints } from '../api/endpoints';

export interface ActivityItem {
  id: string;
  type: 'ride' | 'food' | 'parcel' | 'payment';
  title: string;
  subtitle: string;
  status: string;
  amount: number;
  createdAt: string;
  cancellationReason?: string;
  cancelledBy?: string;
  cancellationFee?: number;
  meta?: Record<string, unknown>;
}

export interface ActivityResponse {
  data: ActivityItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const EMPTY_RESPONSE: ActivityResponse = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 1 },
};

export const ActivityService = {
  async getActivity(page = 1, type?: string): Promise<ActivityResponse> {
    try {
      const params: Record<string, unknown> = { page };
      if (type && type !== 'all') params.type = type;
      const { data } = await apiClient.get(Endpoints.ACTIVITY, { params });
      return {
        data:       Array.isArray(data?.data) ? (data.data as ActivityItem[]) : [],
        pagination: data?.pagination ?? { page: 1, limit: 20, total: 0, pages: 1 },
      };
    } catch {
      return EMPTY_RESPONSE;
    }
  },

  async cancelRide(id: string, reason: string): Promise<{ cancellationFee: number }> {
    const { data } = await apiClient.post(Endpoints.RIDE.CANCEL(id), { reason });
    return data?.data ?? { cancellationFee: 0 };
  },

  async cancelFood(id: string, reason: string): Promise<{ cancellationFee: number }> {
    const { data } = await apiClient.post(Endpoints.FOOD.CANCEL_ORDER(id), { reason });
    return data?.data ?? { cancellationFee: 0 };
  },

  async cancelParcel(id: string, reason: string): Promise<{ cancellationFee: number }> {
    const { data } = await apiClient.post(Endpoints.PARCEL.CANCEL(id), { reason });
    return data?.data ?? { cancellationFee: 0 };
  },
};
