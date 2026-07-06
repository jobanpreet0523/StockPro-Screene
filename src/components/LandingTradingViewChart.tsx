import { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { getTVSymbol } from '../utils/tradingView';

interface LandingTradingViewChartProps {
  symbol: string;
}

export default function LandingTradingViewChart({ symbol }: LandingTradingViewChartProps) {
  const tvSymbol = useMemo(() => getTVSymbol(symbol), [symbol]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus('loading');
    const timeout = window.setTimeout(() => setStatus('unavailable'), 12000);
    return () => window.clearTimeout(timeout);
  }, [tvSymbol, attempt]);

  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f8fafc&theme=light&style=1&timezone=Asia%2FKolkata&locale=en&utm_source=stockpro&utm_medium=widget&utm_campaign=landing`;

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white" data-tradingview-symbol={tvSymbol}>
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">TradingView chart</div>
          <div className="mt-1 font-mono text-xs font-black text-slate-900">{tvSymbol}</div>
        </div>
        <span className="text-[10px] font-bold text-slate-400">Provider-hosted market chart</span>
      </div>

      {status !== 'unavailable' && (
        <iframe
          key={`${tvSymbol}-${attempt}`}
          title={`${tvSymbol} TradingView chart`}
          src={src}
          className="h-[370px] w-full border-0"
          loading="lazy"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('unavailable')}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[61px] flex items-center justify-center bg-white/90 text-xs font-black text-slate-500">
          <RefreshCw size={16} className="mr-2 animate-spin" /> Loading provider chart…
        </div>
      )}

      {status === 'unavailable' && (
        <div className="flex h-[370px] flex-col items-center justify-center px-6 text-center">
          <BarChart3 size={28} className="text-slate-300" />
          <h3 className="mt-3 text-sm font-black text-slate-800">Chart unavailable</h3>
          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-slate-500">
            TradingView did not load. No substitute or simulated chart is being shown.
          </p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
