import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './useNSEProxy';
import { useOptionChainStore } from '../store/optionChainStore';

// Raw NSE option chain response
export interface NSEOptionChainResponse {
  status: string;
  source: string;
  symbol: string;
  data: {
    records: {
      underlyingValue: number;
      timestamp: string;
      expiryDates: string[];
      data: Array<{
        strikePrice: number;
        expiryDate: string;
        CE?: {
          lastPrice: number;
          change: number;
          pChange: number;
          totalTradedVolume: number;
          openInterest: number;
          changeinOpenInterest: number;
          impliedVolatility: number;
          bidQty?: number;
          bidprice?: number;
          askQty?: number;
          askPrice?: number;
        };
        PE?: {
          lastPrice: number;
          change: number;
          pChange: number;
          totalTradedVolume: number;
          openInterest: number;
          changeinOpenInterest: number;
          impliedVolatility: number;
          bidQty?: number;
          bidprice?: number;
          askQty?: number;
          askPrice?: number;
        };
      }>;
    };
  };
}

export function useOptionChain() {
  const { selectedIndex, selectedExpiry } = useOptionChainStore();

  return useQuery({
    queryKey: ['optionChain', selectedIndex, selectedExpiry],
    queryFn: async ({ signal }) => {
      const res = await apiFetch<NSEOptionChainResponse>(`/api/option-chain/${selectedIndex}`, { signal });
      return res;
    },
    refetchInterval: 5_000, // 5s during market hours for OC
    staleTime: 3_000,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000),
  });
}
