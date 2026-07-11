import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  pageIndex: number;
  pageCount: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function TablePagination({ pageIndex, pageCount, canPrevious, canNext, onPrevious, onNext }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 text-xs font-semibold dark:border-slate-800">
      <span>Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}</span>
      <div className="flex gap-2">
        <button type="button" title="Previous page" aria-label="Previous page" onClick={onPrevious} disabled={!canPrevious} className="grid size-8 place-items-center rounded-lg border border-slate-300 disabled:opacity-40 dark:border-slate-700"><ChevronLeft size={15} /></button>
        <button type="button" title="Next page" aria-label="Next page" onClick={onNext} disabled={!canNext} className="grid size-8 place-items-center rounded-lg border border-slate-300 disabled:opacity-40 dark:border-slate-700"><ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
