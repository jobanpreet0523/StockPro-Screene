import { useEffect, useMemo, useRef, useState } from 'react';
import { emitAnalyticsEvent } from './AnalyticsManager';
import { getAdSlotId, loadAdConfig, placeholderAdConfig, type AdConfig, type AdSlotSize } from '../core/adConfig';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  className?: string;
  size: AdSlotSize;
  label?: 'Advertisement' | 'Sponsored';
  sponsorUrl?: string;
  sponsorName?: string;
}

const sizeClasses: Record<AdSlotSize, string> = {
  leaderboard: 'min-h-[112px] sm:min-h-[132px]',
  rectangle: 'min-h-[250px] sm:min-h-[280px]',
  sidebar: 'min-h-[250px] lg:min-h-[420px]',
  in_feed: 'min-h-[180px] sm:min-h-[220px]',
  mobile_banner: 'min-h-[72px] sm:min-h-[96px]',
};

function ensureAdSenseScript(clientId: string) {
  const existing = document.querySelector<HTMLScriptElement>('script[data-stockpro-adsense="true"]');
  if (existing) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.dataset.stockproAdsense = 'true';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Advertisement script unavailable.'));
    document.head.appendChild(script);
  });
}

export default function AdSlot({ className = '', size, label = 'Advertisement', sponsorUrl, sponsorName }: AdSlotProps) {
  const [config, setConfig] = useState<AdConfig>(placeholderAdConfig);
  const [configLoaded, setConfigLoaded] = useState(false);
  const initialized = useRef(false);
  const viewTracked = useRef(false);
  const slotId = useMemo(() => getAdSlotId(config, size), [config, size]);
  const adsenseReady = config.ADS_ENABLED && Boolean(config.ADSENSE_CLIENT_ID && slotId);
  const sponsorReady = label === 'Sponsored' && config.SPONSOR_MODE === 'enabled' && Boolean(sponsorUrl);

  useEffect(() => {
    let active = true;
    loadAdConfig().then((next) => {
      if (!active) return;
      setConfig(next);
      setConfigLoaded(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!configLoaded || viewTracked.current) return;
    viewTracked.current = true;
    emitAnalyticsEvent('ad_slot_view', `${size}:${adsenseReady || sponsorReady ? 'configured' : 'placeholder'}`);
  }, [adsenseReady, configLoaded, size, sponsorReady]);

  useEffect(() => {
    if (!adsenseReady || initialized.current) return;
    initialized.current = true;
    ensureAdSenseScript(config.ADSENSE_CLIENT_ID)
      .then(() => (window.adsbygoogle = window.adsbygoogle || []).push({}))
      .catch(() => { initialized.current = false; });
  }, [adsenseReady, config.ADSENSE_CLIENT_ID]);

  return (
    <aside
      className={`w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70 ${className}`}
      aria-label={label}
      data-ad-size={size}
      data-ad-status={adsenseReady || sponsorReady ? 'configured' : 'placeholder'}
    >
      <div className="border-b border-slate-200 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.22em] text-slate-400 dark:border-slate-800">
        {label}
      </div>
      {adsenseReady ? (
        <ins
          className={`adsbygoogle block w-full max-w-full ${sizeClasses[size]}`}
          data-ad-client={config.ADSENSE_CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format={size === 'in_feed' ? 'fluid' : 'auto'}
          data-full-width-responsive="true"
        />
      ) : sponsorReady ? (
        <a
          href={sponsorUrl}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          data-analytics-event="sponsor_click"
          data-analytics-label={sponsorName || 'Configured sponsor'}
          className={`flex w-full items-center justify-center px-6 py-5 text-center text-sm font-bold text-slate-600 dark:text-slate-300 ${sizeClasses[size]}`}
        >
          {sponsorName || 'Visit sponsor'}
        </a>
      ) : (
        <div className={`flex w-full items-center justify-center px-6 py-5 text-center text-[11px] font-semibold text-slate-400 ${sizeClasses[size]}`}>
          Ad slot reserved
        </div>
      )}
    </aside>
  );
}
