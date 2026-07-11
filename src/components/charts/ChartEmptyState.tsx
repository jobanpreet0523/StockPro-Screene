import { BarChart3 } from 'lucide-react';

export default function ChartEmptyState({ message = 'Chart data unavailable' }: { message?: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900">
      <BarChart3 size={24} className="text-slate-400" />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
