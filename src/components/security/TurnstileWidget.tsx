import { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SCRIPT_URL } from '../../core/turnstile';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_URL}"]`);
    const script = existing || document.createElement('script');
    const onLoad = () => resolve();
    const onError = () => reject(new Error('Turnstile script failed to load.'));
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existing) {
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  action: 'waitlist' | 'contact' | 'signup' | 'trial' | 'beta_feedback';
  onTokenChange: (token: string) => void;
  resetKey?: number;
}

export default function TurnstileWidget({ action, onTokenChange, resetKey = 0 }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'setup_required' | 'error'>('loading');
  const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

  useEffect(() => {
    onTokenChange('');
    if (!siteKey) {
      setState('setup_required');
      return;
    }

    let active = true;
    let widgetId = '';
    setState('loading');

    loadTurnstile().then(() => {
      if (!active || !containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: 'auto',
        callback: (token: string) => {
          if (active) onTokenChange(token);
        },
        'expired-callback': () => onTokenChange(''),
        'error-callback': () => {
          onTokenChange('');
          setState('error');
        },
      });
      setState('ready');
    }).catch(() => {
      if (active) setState('error');
    });

    return () => {
      active = false;
      onTokenChange('');
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, onTokenChange, resetKey, siteKey]);

  if (state === 'setup_required') {
    return <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Anti-spam setup required before this form can submit.</p>;
  }
  if (state === 'error') {
    return <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Anti-spam verification is unavailable. Please retry later.</p>;
  }

  return (
    <div aria-busy={state === 'loading'}>
      <div ref={containerRef} />
      {state === 'loading' && <p className="text-xs font-semibold text-slate-500">Loading anti-spam verification...</p>}
    </div>
  );
}
