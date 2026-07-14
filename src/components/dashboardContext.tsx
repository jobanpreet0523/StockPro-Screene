import { useOutletContext } from 'react-router-dom';
import type { IndexData, Stock } from '../types';
import type { MarketDataStatus } from '../core/marketData';

export type DashboardTab =
  | 'screener' | 'chartink' | 'fo' | 'deals' | 'news' | 'pricing' | 'blog'
  | 'us' | 'strategy-builder' | 'greeks-calculator' | 'risk-calculator'
  | 'heatmap' | 'fii-dii' | 'signals' | 'daily-brief' | 'crt-scanner' | 'pro';

export const TAB_TO_PATH: Record<DashboardTab, string> = {
  screener: '/screener',
  chartink: '/scanner',
  'crt-scanner': '/crt-scanner',
  pro: '/pro',
  fo: '/option-chain',
  us: '/us-markets',
  'strategy-builder': '/strategy-builder',
  'greeks-calculator': '/greeks-calculator',
  'risk-calculator': '/risk-calculator',
  heatmap: '/heatmap',
  'fii-dii': '/fii-dii',
  deals: '/deals',
  news: '/news',
  pricing: '/pricing',
  blog: '/blog',
  signals: '/signals',
  'daily-brief': '/daily-brief',
};

export interface DashboardContext {
  stocks: Stock[];
  indices: IndexData[];
  stockData: Stock[];
  isLoadingStocks: boolean;
  stocksError: string | null;
  retryStocks: () => void;
  selectedStockSymbol: string;
  setSelectedStockSymbol: (symbol: string) => void;
  activeStock: Stock | undefined;
  handleSelectStock: (symbol: string) => void;
  handleSelectFoStock: (symbol: string) => void;
  marketDataStatus: MarketDataStatus;
}

export function useDashboard() {
  return useOutletContext<DashboardContext>();
}