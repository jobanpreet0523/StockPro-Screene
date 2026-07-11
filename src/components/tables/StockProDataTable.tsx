import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import TableEmptyState from './TableEmptyState';
import TablePagination from './TablePagination';
import TableToolbar from './TableToolbar';

interface StockProDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  emptyMessage?: string;
  filterPlaceholder?: string;
  onExportCsv?: () => void;
  pageSize?: number;
}

export default function StockProDataTable<T>({ data, columns, emptyMessage, filterPlaceholder, onExportCsv, pageSize = 25 }: StockProDataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="p-3">
        <TableToolbar filter={globalFilter} onFilterChange={setGlobalFilter} placeholder={filterPlaceholder} onExportCsv={onExportCsv} canExport={data.length > 0} />
      </div>
      {table.getRowModel().rows.length === 0 ? <TableEmptyState message={emptyMessage} /> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="whitespace-nowrap px-4 py-3">
                      {header.isPlaceholder ? null : (
                        <button type="button" className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePagination pageIndex={table.getState().pagination.pageIndex} pageCount={table.getPageCount()} canPrevious={table.getCanPreviousPage()} canNext={table.getCanNextPage()} onPrevious={table.previousPage} onNext={table.nextPage} />
    </div>
  );
}
