import { create } from 'zustand';
import type { CuisineType } from '../constants/enums';

interface FoodState {
  selectedCuisine: CuisineType | null;
  searchQuery: string;
  activeOrderId: string | null;
  setSelectedCuisine: (cuisine: CuisineType | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveOrderId: (orderId: string | null) => void;
  reset: () => void;
}

export const useFoodStore = create<FoodState>((set) => ({
  selectedCuisine: null,
  searchQuery: '',
  activeOrderId: null,
  setSelectedCuisine: (selectedCuisine) => set({ selectedCuisine }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveOrderId: (activeOrderId) => set({ activeOrderId }),
  reset: () => set({ selectedCuisine: null, searchQuery: '', activeOrderId: null }),
}));
