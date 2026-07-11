import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import ProSidebar, { type ProSection } from './ProSidebar';
import ProTopbar from './ProTopbar';

export default function ProLayout({ active, onSelect, children }: { active: ProSection; onSelect: (section: ProSection) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const select = (section: ProSection) => { onSelect(section); setOpen(false); };
  return <div className="min-h-[760px] overflow-hidden border border-slate-200 bg-white text-slate-950 shadow-sm">
    <ProTopbar onMenu={() => setOpen(true)} />
    <div className="grid lg:grid-cols-[220px_1fr]">
      <aside className="hidden min-h-[700px] border-r border-slate-200 p-3 lg:block"><div className="px-3 py-4"><p className="text-xs font-bold uppercase text-emerald-700">StockPro</p><p className="text-xl font-black">Pro Workspace</p></div><ProSidebar active={active} onSelect={select}/></aside>
      {open && <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden"><aside className="h-full w-72 bg-white p-3"><button type="button" onClick={() => setOpen(false)} title="Close menu" className="ml-auto block rounded-md border border-slate-200 p-2"><X size={18}/></button><div className="px-3 py-4 text-xl font-black">StockPro Pro</div><ProSidebar active={active} onSelect={select}/></aside></div>}
      <main className="min-w-0 bg-slate-50 p-4 sm:p-6">{children}</main>
    </div>
  </div>;
}
