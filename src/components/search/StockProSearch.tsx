import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { fetchSearchRuntimeConfig, getSearchClient, type SearchRuntimeConfig } from '../../core/searchConfig';
import { searchResultItemSchema, type SearchResultItem } from '../../core/schemas';
import SearchResultCard from './SearchResultCard';

export default function StockProSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useMemo(() => getSearchClient(), []);
  const [runtime, setRuntime] = useState<SearchRuntimeConfig>({ status: 'setup_required', indices: [], message: 'Checking search setup...' });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [message, setMessage] = useState('');
  const unavailable = !client || runtime.status !== 'configured';

  useEffect(() => {
    const controller = new AbortController();
    fetchSearchRuntimeConfig(controller.signal).then(setRuntime).catch(() => setRuntime({
      status: 'setup_required',
      indices: [],
      message: 'Search configuration is unavailable.',
    }));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (autoFocus && !unavailable) inputRef.current?.focus();
  }, [autoFocus, unavailable]);

  useEffect(() => {
    if (!client || runtime.status !== 'configured' || query.trim().length < 2) {
      setResults([]);
      setMessage('');
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await client.search({
          requests: runtime.indices.map((indexName) => ({ indexName, query: query.trim(), hitsPerPage: 6 })),
        });
        if (!active) return;
        const parsed = response.results.flatMap((result) => 'hits' in result ? result.hits : [])
          .map((hit) => searchResultItemSchema.safeParse(hit))
          .filter((item) => item.success)
          .map((item) => item.data);
        setResults(parsed);
        setMessage(parsed.length ? '' : 'No verified search results found.');
      } catch {
        if (active) {
          setResults([]);
          setMessage('Search provider unavailable. No substitute results are shown.');
        }
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [client, query, runtime]);

  return (
    <div className="relative">
      <label className="relative block">
        <span className="sr-only">Search StockPro</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} disabled={unavailable} placeholder={unavailable ? 'Search setup required' : 'Search stocks, sectors, and guides'} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950" />
      </label>
      {(results.length > 0 || message) && (
        <div className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {results.map((result) => <SearchResultCard key={result.objectID} result={result} />)}
          {message && <p className="p-4 text-xs font-semibold text-slate-500">{message}</p>}
        </div>
      )}
    </div>
  );
}
