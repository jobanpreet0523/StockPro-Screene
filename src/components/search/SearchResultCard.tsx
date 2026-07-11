import { Link } from 'react-router-dom';
import type { SearchResultItem } from '../../core/schemas';

export default function SearchResultCard({ result }: { result: SearchResultItem }) {
  return (
    <Link to={result.url} className="block border-b border-slate-200 px-4 py-3 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{result.title}</p>
          {result.subtitle && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{result.subtitle}</p>}
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">{result.kind.replace('_', ' ')}</span>
      </div>
    </Link>
  );
}
