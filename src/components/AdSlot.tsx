import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  className?: string;
  client?: string;
  slot?: string;
  format?: string;
}

export default function AdSlot({ className = '', client, slot, format = 'auto' }: AdSlotProps) {
  useEffect(() => {
    if (!client || !slot) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('Advertisement slot could not be initialized.', error);
    }
  }, [client, slot]);

  return (
    <aside className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${className}`} aria-label="Advertisement">
      <div className="border-b border-slate-200 px-3 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">
        Advertisement
      </div>
      {client && slot ? (
        <ins
          className="adsbygoogle block min-h-24"
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-24 items-center justify-center px-6 py-5 text-center text-[11px] font-semibold text-slate-400">
          Advertising space reserved. Ads are not configured.
        </div>
      )}
    </aside>
  );
}
