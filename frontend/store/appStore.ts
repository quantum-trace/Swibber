import { create } from 'zustand';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface AppState {
  toasts: ToastMessage[];
  isGlobalLoading: boolean;
  notifications: any[];
  readIds: Set<string>;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
}

let _toastCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  toasts: [],
  isGlobalLoading: false,
  notifications: [],
  readIds: new Set(),

  showToast: (toast) => {
    const id = `toast_${++_toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => get().dismissToast(id), toast.duration ?? 3000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),

  markAllRead: () => set((state) => ({ readIds: new Set(state.notifications.map((n: any) => n.id)) })),
  
  markRead: (id) => set((state) => {
    const newReadIds = new Set(state.readIds);
    newReadIds.add(id);
    return { readIds: newReadIds };
  }),

  clearAllNotifications: () => set({ notifications: [] }),

  deleteNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n: any) => n.id !== id) })),
}));
