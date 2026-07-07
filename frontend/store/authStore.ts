import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isBootstrapped: boolean;
  setToken: (token: string | null) => void;
  setBootstrapped: (val: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isBootstrapped: false,
  setToken: (token) => set({ token }),
  setBootstrapped: (isBootstrapped) => set({ isBootstrapped }),
  reset: () => set({ token: null }),
}));
