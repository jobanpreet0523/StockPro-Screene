import { create } from 'zustand';

export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY';

interface OptionChainStore {
  selectedIndex: IndexSymbol;
  selectedExpiry: string;
  setSelectedIndex: (idx: IndexSymbol) => void;
  setSelectedExpiry: (exp: string) => void;
}

export const useOptionChainStore = create<OptionChainStore>((set) => ({
  selectedIndex: 'NIFTY',
  selectedExpiry: '',
  setSelectedIndex: (idx) => set({ selectedIndex: idx, selectedExpiry: '' }),
  setSelectedExpiry: (exp) => set({ selectedExpiry: exp }),
}));
