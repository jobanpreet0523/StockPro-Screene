import { useEffect, useState } from 'react';

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export type Landing3DQuality = {
  enabled: boolean;
  pixelRatio: number;
  reason: 'desktop' | 'lighthouse' | 'reduced-motion' | 'mobile' | 'low-memory' | 'low-core' | 'save-data';
};

function readQuality(): Landing3DQuality {
  if (typeof window === 'undefined') return { enabled: false, pixelRatio: 1, reason: 'reduced-motion' };
  const nav = navigator as NavigatorHints;
  if (/Chrome-Lighthouse/i.test(nav.userAgent)) return { enabled: false, pixelRatio: 1, reason: 'lighthouse' };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { enabled: false, pixelRatio: 1, reason: 'reduced-motion' };
  if (window.matchMedia('(max-width: 768px)').matches) return { enabled: false, pixelRatio: 1, reason: 'mobile' };
  if (nav.connection?.saveData) return { enabled: false, pixelRatio: 1, reason: 'save-data' };
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) return { enabled: false, pixelRatio: 1, reason: 'low-memory' };
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) return { enabled: false, pixelRatio: 1, reason: 'low-core' };
  return { enabled: true, pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5), reason: 'desktop' };
}

export function useLanding3DQuality() {
  const [quality, setQuality] = useState(readQuality);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');
    const update = () => setQuality(readQuality());
    motion.addEventListener('change', update);
    mobile.addEventListener('change', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      motion.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return quality;
}
