import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
import { getTVSymbol } from '../utils/tradingView';

interface LandingTradingViewChartProps {
  symbol: string;
}

export default function LandingTradingViewChart({ symbol }: LandingTradingViewChartProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tvSymbol = useMemo(() => getTVSymbol(symbol || 'NIFTY'), [symbol]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus('idle');
    setAttempt(0);
  }, [tvSymbol]);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || status !== 'idle') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.15)) {
        setStatus('loading');
        observer.disconnect();
      }
    }, { rootMargin: '200px 0px', threshold: [0.15] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    if (status !== 'loading') return;
    const timeout = window.setTimeout(() => setStatus('unavailable'), 12000);
    return () => window.clearTimeout(timeout);
  }, [status, attempt, tvSymbol]);

  const src = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=f8fafc&theme=light&style=1&timezone=Asia%2FKolkata&locale=en&utm_source=stockpro&utm_medium=widget&utm_campaign=landing`;
  const externalUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;

  const loadChart = () => {
    setAttempt((value) => value + 1);
    setStatus('loading');
  };

  return (
    <div ref={wrapperRef} className="relative min-h-[460px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white" data-tradingview-symbol={tvSymbol}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">TradingView chart</div>
          <div className="mt-1 font-mono text-xs font-black text-slate-900">{tvSymbol}</div>
        </div>
        <a href={externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 transition hover:border-blue-300 hover:text-blue-700">
          Open chart <ExternalLink size={12} />
        </a>
      </div>

      {status === 'idle' && (
        <div className="flex h-[398px] flex-col items-center justify-center px-6 text-center">
          <BarChart3 size={30} className="text-blue-300" />
          <h3 className="mt-3 text-sm font-black text-slate-800">Provider chart ready to load</h3>
          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-slate-500">
            The TradingView embed loads only when this panel is visible to keep the landing page fast.
          </p>
          <button type="button" onClick={loadChart} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
            Load chart
          </button>
        </div>
      )}

      {status !== 'idle' && status !== 'unavailable' && (
        <iframe
          key={`${tvSymbol}-${attempt}`}
          title={`${tvSymbol} TradingView chart`}
          src={src}
          className="block h-[398px] min-h-[398px] w-full min-w-full border-0"
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
        <div className="flex h-[398px] flex-col items-center justify-center px-6 text-center">
          <BarChart3 size={28} className="text-slate-300" />
          <h3 className="mt-3 text-sm font-black text-slate-800">TradingView chart unavailable</h3>
          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-slate-500">
            No substitute or simulated chart is being shown. You can open the symbol directly in TradingView.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={loadChart} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700">
              Try again
            </button>
            <a href={externalUrl} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 hover:border-blue-300 hover:text-blue-700">
              Open in TradingView
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
