import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import StockScreener from '../components/StockScreener';
import StockChart from '../components/StockChart';
import ProductGrowthPanel from '../components/ProductGrowthPanel';
import { useDashboard, TAB_TO_PATH, type DashboardTab } from '../components/Layout';

export default function ScreenerPage() {
  const navigate = useNavigate();
  const { stocks, activeStock, handleSelectStock, handleSelectFoStock } = useDashboard();
  const setActiveTab = (tab: DashboardTab) => navigate(TAB_TO_PATH[tab] || '/screener');

  return (
    <>
      <div className="lg:col-span-12">
        <ProductGrowthPanel setActiveTab={setActiveTab} />
      </div>

      <div className="lg:col-span-8 flex flex-col gap-6">
        <StockScreener
          stocks={stocks}
          onSelectStock={handleSelectStock}
          onSelectFoStock={handleSelectFoStock}
        />
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="sticky top-[140px] flex flex-col gap-4">
          {activeStock && <StockChart symbol={activeStock.symbol} name={activeStock.name} />}

          <div className="bg-white dark:bg-slate-950/60 p-4 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col gap-2.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Market Overview Desk</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Select any asset in the table to load its research card. Free mode keeps conservative delayed-data labels and focuses on education, screening, and workflow clarity.
            </p>
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-555 dark:text-emerald-400" /> Trust labels</span>
              <span>15-min delay</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
