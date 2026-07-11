import { Download, Search } from 'lucide-react';

interface TableToolbarProps {
  filter: string;
  onFilterChange: (value: string) => void;
  placeholder?: string;
  onExportCsv?: () => void;
  canExport?: boolean;
}

export default function TableToolbar({ filter, onFilterChange, placeholder = 'Filter results', onExportCsv, canExport = false }: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={filter} onChange={(event) => onFilterChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
      </label>
      {onExportCsv && (
        <button type="button" onClick={onExportCsv} disabled={!canExport} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50 dark:border-slate-700">
          <Download size={14} /> Export CSV
        </button>
      )}
    </div>
  );
}
