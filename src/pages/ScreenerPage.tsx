import React from 'react';
import { ShieldCheck } from 'lucide-react';
import StockScreener from '../components/StockScreener';
import StockChart from '../components/StockChart';
import { useDashboard } from '../components/Layout';

export default function ScreenerPage() {
  const { stocks, activeStock, handleSelectStock, handleSelectFoStock } = useDashboard();

  return (
    <>
      {/* Left Column: Extensive filter table grid (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <StockScreener
          stocks={stocks}
          onSelectStock={handleSelectStock}
          onSelectFoStock={handleSelectFoStock}
        />
      </div>

      {/* Right Column: Dynamic Interactive chart overlay (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="sticky top-[140px] flex flex-col gap-4">
          {activeStock && <StockChart symbol={activeStock.symbol} name={activeStock.name} />}

          <div className="bg-white dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col gap-2.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Market Overview Desk</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Select any asset in the Stock Table Left to load its instant technical overlays. StockPro integrates with public indexes in full-fidelity.
            </p>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-555 dark:text-emerald-400" /> Secure Nodes</span>
              <span>Tick latency: ~1.5s</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
