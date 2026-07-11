import { Menu, Search, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProTopbar({ onMenu }: { onMenu: () => void }) {
  return <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
    <button type="button" onClick={onMenu} title="Open workspace menu" className="rounded-md border border-slate-200 p-2 lg:hidden"><Menu size={18}/></button>
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3"><Search size={16} className="text-slate-400"/><input aria-label="Search Pro workspace" placeholder="Search symbols and research..." className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"/></label>
    <Link to="/start-trial" data-analytics-event="start_trial_click" className="hidden rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950 sm:block">Start trial</Link>
    <Link to="/account" title="Account" className="rounded-md border border-slate-200 p-2.5"><UserRound size={17}/></Link>
  </header>;
}
