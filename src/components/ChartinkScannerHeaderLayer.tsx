import { BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChartinkScannerHeaderLayer() {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" id="scanner_header_layer">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Technical scanner</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Educational scan workspace using only the configured StockPro provider.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Scanner resources">
          <Link to="/data-methodology" className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><ShieldCheck size={14} aria-hidden /> Methodology</Link>
          <Link to="/blog" className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><BookOpen size={14} aria-hidden /> Education</Link>
          <Link to="/contact" className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200"><MessageSquare size={14} aria-hidden /> Feedback</Link>
        </nav>
      </div>
    </section>
  );
}
