import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_FALLBACK_ID = 'G-KK6FYQQ6GV';
const BUILD_GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || GA_FALLBACK_ID;

function loadGa(measurementId: string) {
  if (!measurementId) return;
  if (document.querySelector(`script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`)) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

function sendEvent(measurementId: string, name: string, label: string, path: string) {
  if (!measurementId || !window.gtag) return;
  window.gtag('event', name, {
    send_to: measurementId,
    event_label: label,
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export default function AnalyticsManager() {
  const location = useLocation();
  const [gaId, setGaId] = useState(BUILD_GA_ID);

  useEffect(() => {
    if (BUILD_GA_ID !== GA_FALLBACK_ID) return;
    let active = true;
    fetch('/api/site-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const runtimeGaId = typeof json?.gaMeasurementId === 'string' ? json.gaMeasurementId : '';
        if (active && runtimeGaId) setGaId(runtimeGaId);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!gaId) return;
    loadGa(gaId);
  }, [gaId]);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (!gaId || !window.gtag) return;

    sendEvent(gaId, 'page_view', 'Page viewed', path);

    if (location.pathname === '/screener') sendEvent(gaId, 'screener_view', 'Screener opened', path);
    if (location.pathname === '/pricing') sendEvent(gaId, 'pricing_view', 'Pricing opened', path);
    if (location.pathname === '/contact') sendEvent(gaId, 'waitlist_view', 'Waitlist opened', path);
    if (location.pathname === '/blog') sendEvent(gaId, 'growth_hub_view', 'Blog growth hub opened', path);
    if (location.pathname === '/daily-brief') sendEvent(gaId, 'daily_brief_view', 'Daily Brief opened', path);
  }, [gaId, location.pathname, location.search]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a,button');
      if (!target) return;
      const text = (target.textContent || '').toLowerCase();
      const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';
      const path = `${window.location.pathname}${window.location.search}`;
      const explicitEvent = target.getAttribute('data-analytics-event');
      const explicitLabel = target.getAttribute('data-analytics-label');

      if (explicitEvent) {
        sendEvent(gaId, explicitEvent, (explicitLabel || text || href).slice(0, 80), path);
        return;
      }

      if (text.includes('waitlist') || href.includes('interest=')) sendEvent(gaId, 'waitlist_click', text.slice(0, 80) || href, path);
      if (text.includes('pricing') || text.includes('plans')) sendEvent(gaId, 'pricing_click', text.slice(0, 80), path);
      if (text.includes('screener') || text.includes('start free') || text.includes('open app')) sendEvent(gaId, 'tool_open_click', text.slice(0, 80), path);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [gaId]);

  return null;
}
