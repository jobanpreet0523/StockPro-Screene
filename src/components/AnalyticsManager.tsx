import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

function loadGa(measurementId: string) {
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
  window.gtag('config', measurementId, { send_page_view: false });
}

function sendEvent(name: string, label: string, path: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', name, {
    event_label: label,
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export default function AnalyticsManager() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;
    loadGa(GA_ID);
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (!GA_ID || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });

    if (location.pathname === '/screener') sendEvent('screener_view', 'Screener opened', path);
    if (location.pathname === '/pricing') sendEvent('pricing_view', 'Pricing opened', path);
    if (location.pathname === '/contact') sendEvent('waitlist_view', 'Waitlist opened', path);
    if (location.pathname === '/blog') sendEvent('growth_hub_view', 'Blog growth hub opened', path);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('a,button');
      if (!target) return;
      const text = (target.textContent || '').toLowerCase();
      const href = target instanceof HTMLAnchorElement ? target.getAttribute('href') || '' : '';
      const path = `${window.location.pathname}${window.location.search}`;

      if (text.includes('waitlist') || href.includes('interest=')) sendEvent('waitlist_click', text.slice(0, 80) || href, path);
      if (text.includes('pricing') || text.includes('plans')) sendEvent('pricing_click', text.slice(0, 80), path);
      if (text.includes('screener') || text.includes('start free') || text.includes('open app')) sendEvent('tool_open_click', text.slice(0, 80), path);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
}
