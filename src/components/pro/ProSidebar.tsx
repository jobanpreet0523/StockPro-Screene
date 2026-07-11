import { BarChart3, Bell, Bookmark, Bot, ChartCandlestick, Compass, Database, LayoutDashboard, ListFilter } from 'lucide-react';

export const proSections = [
  ['dashboard','Dashboard',LayoutDashboard], ['watchlist','Watchlist',Bookmark], ['ideas','Ideas',Compass],
  ['screener','Screener',ListFilter], ['data','Data Explorer',Database], ['charts','Charts',ChartCandlestick],
  ['saved','Saved Work',Bell], ['ai','AI Research',Bot], ['getting-started','Getting Started',BarChart3],
] as const;
export type ProSection = typeof proSections[number][0];

export default function ProSidebar({ active, onSelect }: { active: ProSection; onSelect: (section: ProSection) => void }) {
  return <nav aria-label="Pro workspace" className="grid gap-1">{proSections.map(([id,label,Icon]) => <button key={id} type="button" onClick={() => onSelect(id)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold ${active === id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Icon size={17}/>{label}</button>)}</nav>;
}
