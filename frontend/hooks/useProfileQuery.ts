import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthContext } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';

export const useUserProfile = () => {
  const { isAuthenticated } = useAuthContext();
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => { const { data } = await apiClient.get('/user/profile'); return data.data; },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdateProfile = () => {
  const { updateUser } = useAuthContext();
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; email?: string; gender?: string; phone?: string }) => {
      const { data } = await apiClient.put('/user/profile', payload);
      return data.data;
    },
    onSuccess: (user) => {
      updateUser(user);
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      showToast({ type: 'success', message: 'Profile updated' });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Failed to update profile';
      showToast({ type: 'error', message });
    },
  });
};

export const useSavedAddresses = () =>
  useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => { const { data } = await apiClient.get('/user/addresses'); return data.data; },
    staleTime: 1000 * 60 * 5,
  });

export const useAddAddress = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { type: string; label: string; address: string; lat: number; lng: number }) => {
      const { data } = await apiClient.post('/user/addresses', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-addresses'] });
      showToast({ type: 'success', message: 'Address saved' });
    },
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/user/addresses/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-addresses'] }),
  });
};

export const useUpdateAddress = () => {
  const { showToast } = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; type: string; label: string; address: string; lat: number; lng: number }) => {
      const { data } = await apiClient.put(`/user/addresses/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-addresses'] });
      showToast({ type: 'success', message: 'Address updated' });
    },
    onError: () => showToast({ type: 'error', message: 'Failed to update address' }),
  });
};
