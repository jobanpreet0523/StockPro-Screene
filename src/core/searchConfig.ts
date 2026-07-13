import { liteClient } from 'algoliasearch/lite';

export interface SearchRuntimeConfig {
  status: 'configured' | 'setup_required';
  indices: string[];
  message: string;
}

export function getSearchClient() {
  if (typeof window !== 'undefined' && ['127.0.0.1', 'localhost'].includes(window.location.hostname)) {
    const testClient = (window as typeof window & { __STOCKPRO_SEARCH_TEST_CLIENT__?: ReturnType<typeof liteClient> }).__STOCKPRO_SEARCH_TEST_CLIENT__;
    if (testClient) return testClient;
  }

  const appId = String(import.meta.env.VITE_ALGOLIA_APP_ID || '').trim();
  const searchKey = String(import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '').trim();
  return appId && searchKey ? liteClient(appId, searchKey) : null;
}

export async function fetchSearchRuntimeConfig(signal?: AbortSignal): Promise<SearchRuntimeConfig> {
  const response = await fetch('/api/search/config', { signal });
  const payload = await response.json().catch(() => null) as Partial<SearchRuntimeConfig> | null;
  if (!response.ok || payload?.status !== 'configured' || !Array.isArray(payload.indices)) {
    return { status: 'setup_required', indices: [], message: payload?.message || 'Search indexes are not configured.' };
  }
  const indices = payload.indices.filter((item): item is string => typeof item === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(item));
  return indices.length
    ? { status: 'configured', indices, message: 'Search is configured.' }
    : { status: 'setup_required', indices: [], message: 'Search indexes are not configured.' };
}

export function searchClientReadiness() {
  return getSearchClient() ? 'configured' as const : 'setup_required' as const;
}
