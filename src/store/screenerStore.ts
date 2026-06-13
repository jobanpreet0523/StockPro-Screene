import { create } from 'zustand';

export interface ScreenerFilters {
  index: 'NIFTY 50' | 'NIFTY 100' | 'NIFTY 200' | 'NIFTY 500' | 'All NSE';
  priceMin: number;
  priceMax: number;
  capCategory: 'All' | 'Large' | 'Mid' | 'Small';
  changeMin: number;
  changeMax: number;
  sector: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  page: number;
}

interface ScreenerStore {
  filters: ScreenerFilters;
  setFilter: <K extends keyof ScreenerFilters>(key: K, val: ScreenerFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: ScreenerFilters = {
  index: 'NIFTY 50',
  priceMin: 0, priceMax: Infinity,
  capCategory: 'All',
  changeMin: -Infinity, changeMax: Infinity,
  sector: '',
  sortBy: 'changePercent', sortDir: 'desc',
  page: 1,
};

export const useScreenerStore = create<ScreenerStore>((set) => ({
  filters: { ...defaultFilters },
  setFilter: (key, val) => set((s) => ({ filters: { ...s.filters, [key]: val } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
