import { useQuery } from '@tanstack/react-query';
import { fetchMarketData } from '../core/marketDataClient';
import type { MarketDataEnvelope, OptionChainResponse } from '../core/marketDataProvider';
import { useOptionChainStore } from '../store/optionChainStore';

export type NSEOptionChainResponse = MarketDataEnvelope<OptionChainResponse>;

export function useOptionChain() {
  const { selectedIndex, selectedExpiry } = useOptionChainStore();

  return useQuery({
    queryKey: ['optionChain', selectedIndex, selectedExpiry],
    queryFn: async ({ signal }) => {
      const response = await fetchMarketData<OptionChainResponse>(`/api/live/option-chain/${encodeURIComponent(selectedIndex)}`, signal);
      if (response.status !== 'ok' || !response.data) throw new Error(response.message || 'Option-chain provider is unavailable.');
      return response;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}
