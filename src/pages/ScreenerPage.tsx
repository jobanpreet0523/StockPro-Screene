import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Crown, Download, LineChart, Radar, ShieldCheck, Star, Target, TrendingUp } from 'lucide-react';
import StockScreener from '../components/StockScreener';
import StockChart from '../components/StockChart';
import ProductGrowthPanel from '../components/ProductGrowthPanel';
import { useDashboard, TAB_TO_PATH, type DashboardTab } from '../components/Layout';

export default function ScreenerPage() {
  const navigate = useNavigate();
  const { stocks, activeStock, handleSelectStock, handleSelectFoStock } = useDashboard();
  const setActiveTab = (tab: DashboardTab) => navigate(TAB_TO_PATH[tab] || '/screener');

  const desk = useMemo(() => {
    const gainers = stocks.filter((stock) => stock.changePercent > 0).length;
    const losers = stocks.filter((stock) => stock.changePercent < 0).length;
    const breadth = stocks.length ? Math.round((gainers / stocks.length) * 100) : 0;
    const topMover = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0];
    const volumeLeader = [...stocks].sort((a, b) => (b.volume || 0) - (a.volume || 0))[0];
    const foCount = stocks.filter((stock) => stock.isFoEnabled).length;
    return { gainers, losers, breadth, topMover, volumeLeader, foCount };
  }, [stocks]);

  return (
    <>
      <div className="lg:col-span-12">
        <ProductGrowthPanel setActiveTab={setActiveTab} />
      </div>

      <div className="lg:col-span-12 grid gap-3 md:grid-cols-3">
        <button onClick={() => setActiveTab('screener')} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/75">
          <Star size={18} className="text-amber-500" />
          <div className="mt-3 text-sm font-black text-slate-950 dark:text-white">Build a watchlist</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Click the star beside symbols to make the screener feel personal and useful on repeat visits.</p>
        </button>
        <button onClick={() => setActiveTab('pricing')} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <Bell size={18} className="text-emerald-600 dark:text-emerald-400" />
          <div className="mt-3 text-sm font-black text-slate-950 dark:text-white">Alerts roadmap</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">Show users that Pro will add alerts, saved screens, and daily workflow automation.</p>
        </button>
        <button onClick={() => setActiveTab('pricing')} className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800">
          <Crown size={18} className="text-emerald-300" />
          <div className="mt-3 text-sm font-black">Export and Pro tools</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-300"><Download size={12} className="mr-1 inline" />Keep free useful, then convert serious users with saved workflows and export features.</p>
        </button>
      </div>

      <div className="lg:col-span-12 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/75">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <Radar size={13} /> Daily research desk
            </div>
            <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Your quick briefing before opening the table.</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">Stage 2 turns the page into a daily workflow: briefing, screening, chart review, watchlist habit, and upgrade path.</p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-4 lg:min-w-[560px]">
            <MiniStat label="Breadth" value={`${desk.breadth}%`} helper={`${desk.gainers} up · ${desk.losers} down`} />
            <MiniStat label="Top mover" value={desk.topMover?.symbol?.replace('.NS', '') || '—'} helper={desk.topMover ? `${desk.topMover.changePercent >= 0 ? '+' : ''}${desk.topMover.changePercent}%` : 'waiting'} />
            <MiniStat label="Volume lead" value={desk.volumeLeader?.symbol?.replace('.NS', '') || '—'} helper="highest volume" />
            <MiniStat label="F&O list" value={`${desk.foCount}`} helper="symbols ready" />
          </div>
        </div>
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

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300"><Target size={13} /> Retention loop</div>
            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <button onClick={() => setActiveTab('chartink')} className="rounded-xl bg-white px-3 py-2 text-left transition hover:bg-emerald-100 dark:bg-slate-950/60 dark:hover:bg-slate-900"><LineChart size={13} className="mr-2 inline text-emerald-600" />Open scanner presets</button>
              <button onClick={() => setActiveTab('signals')} className="rounded-xl bg-white px-3 py-2 text-left transition hover:bg-emerald-100 dark:bg-slate-950/60 dark:hover:bg-slate-900"><Bell size={13} className="mr-2 inline text-emerald-600" />Review signal center</button>
              <button onClick={() => setActiveTab('pricing')} className="rounded-xl bg-white px-3 py-2 text-left transition hover:bg-emerald-100 dark:bg-slate-950/60 dark:hover:bg-slate-900"><TrendingUp size={13} className="mr-2 inline text-emerald-600" />Join Pro roadmap</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value}</div>
      <div className="mt-0.5 truncate text-[10px] font-bold text-slate-500 dark:text-slate-400">{helper}</div>
    </div>
  );
}
