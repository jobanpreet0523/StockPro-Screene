import { Database } from 'lucide-react';

export default function TableEmptyState({ message = 'No verified data is available.' }: { message?: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 p-6 text-center text-slate-500">
      <Database size={22} aria-hidden="true" />
      <p className="text-sm font-semibold">{message}</p>
    </div>
  );
}
