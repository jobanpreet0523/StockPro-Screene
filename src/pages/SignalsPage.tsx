import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Share2, Zap, Activity } from 'lucide-react';
import { Stock } from '../types';
import { getMarketStatus } from '../utils/marketStatus';
import { useDashboard } from '../components/Layout';

type SignalType = 'BUY' | 'SELL';

interface Signal {
  symbol: string;
  name: string;
  type: SignalType;
  price: number;
  changePercent: number;
  volume: number;
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;
}

function buildSignal(stock: Stock): Signal | null {
  const change = stock.changePercent ?? 0;
  const price = stock.price ?? 0;
  if (!price) return null;

  // Actionable momentum signals: strong move + meaningful volume
  const strongVolume = (stock.volume ?? 0) > 500000;
  let type: SignalType | null = null;
  if (change >= 1.5 && strongVolume) type = 'BUY';
  else if (change <= -1.5 && strongVolume) type = 'SELL';
  if (!type) return null;

  const entry = price;
  const target = type === 'BUY' ? entry * 1.03 : entry * 0.97;
  const stopLoss = type === 'BUY' ? entry * 0.985 : entry * 1.015;
  // Confidence scales with the strength of the move (capped at 95%)
  const confidence = Math.min(95, Math.round(60 + Math.abs(change) * 6));

  return {
    symbol: stock.symbol.replace('.NS', ''),
    name: stock.name,
    type,
    price,
    changePercent: change,
    volume: stock.volume ?? 0,
    entry,
    target,
    stopLoss,
    confidence,
  };
}

function formatNum(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SignalsPage() {
  const { stocks, isLoadingStocks } = useDashboard();
  const [filter, setFilter] = useState<'ALL' | SignalType>('ALL');
  const market = getMarketStatus();

  const signals = useMemo(() => {
    return stocks
      .map(buildSignal)
      .filter((s): s is Signal => s !== null)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }, [stocks]);

  const visible = signals.filter(s => filter === 'ALL' || s.type === filter);
  const buyCount = signals.filter(s => s.type === 'BUY').length;
  const sellCount = signals.filter(s => s.type === 'SELL').length;

  const shareOnWhatsApp = (s: Signal) => {
    const text =
      `📊 StockPro Signal: ${s.type} ${s.symbol}\n` +
      `Entry: ₹${formatNum(s.entry)}\n` +
      `Target: ₹${formatNum(s.target)}\n` +
      `Stop Loss: ₹${formatNum(s.stopLoss)}\n` +
      `Change: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%\n` +
      `Confidence: ${s.confidence}%`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="signals-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-sans font-black flex items-center gap-2 text-slate-900 dark:text-white">
            <Zap size={20} className="text-emerald-500" />
            Live Trade Signals
          </h1>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
            Auto-generated BUY / SELL signals derived from live Yahoo Finance momentum &amp; volume. Refreshes with the stock feed.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start md:self-auto text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono"
          style={{ color: market.color, backgroundColor: `${market.color}15`, border: `1px solid ${market.color}40` }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: market.color }} />
          {market.label}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition shadow-sm ${filter === 'ALL' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950'}`}
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider"><Activity size={12} /> Total Signals</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{signals.length}</div>
        </button>
        <button
          onClick={() => setFilter('BUY')}
          className={`p-4 rounded-xl border text-left transition shadow-sm ${filter === 'BUY' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950'}`}
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider"><TrendingUp size={12} /> Buy</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{buyCount}</div>
        </button>
        <button
          onClick={() => setFilter('SELL')}
          className={`p-4 rounded-xl border text-left transition shadow-sm ${filter === 'SELL' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950'}`}
        >
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider"><TrendingDown size={12} /> Sell</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{sellCount}</div>
        </button>
      </div>

      {isLoadingStocks ? (
        <div className="text-center py-16 text-slate-400 text-sm font-mono">Generating signals from live data…</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <Activity size={28} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No actionable signals right now</h3>
          <p className="text-xs text-slate-500 mt-1">Signals appear when stocks show a strong move (±1.5%) on meaningful volume.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((s) => {
            const isBuy = s.type === 'BUY';
            return (
              <div key={s.symbol} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-black text-slate-900 dark:text-white font-mono">{s.symbol}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={s.name}>{s.name}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded ${isBuy ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>
                    {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {s.type}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">₹{formatNum(s.price)}</div>
                  <div className={`text-xs font-bold font-mono ${s.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2">
                    <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Entry</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">₹{formatNum(s.entry)}</div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-2">
                    <div className="text-[9px] uppercase font-bold text-emerald-500 tracking-wider flex items-center justify-center gap-0.5"><Target size={9} /> Target</div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">₹{formatNum(s.target)}</div>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-2">
                    <div className="text-[9px] uppercase font-bold text-rose-500 tracking-wider flex items-center justify-center gap-0.5"><Shield size={9} /> SL</div>
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">₹{formatNum(s.stopLoss)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Confidence</span><span>{s.confidence}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${s.confidence}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => shareOnWhatsApp(s)}
                    title="Share on WhatsApp"
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-2 rounded-lg bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition"
                  >
                    <Share2 size={12} /> Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
        Signals are auto-generated from live price momentum and volume for educational purposes only and are not investment advice.
      </p>
    </div>
  );
}
