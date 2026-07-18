import { useEffect, useState } from 'react';

type NavigatorHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export type Landing3DQuality = {
  enabled: boolean;
  pixelRatio: number;
  tier: 'static' | 'standard' | 'high';
  reason: 'desktop' | 'lighthouse' | 'reduced-motion' | 'mobile' | 'low-memory' | 'low-core' | 'save-data';
};

function readQuality(): Landing3DQuality {
  if (typeof window === 'undefined') return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'reduced-motion' };
  const nav = navigator as NavigatorHints;
  if (/Chrome-Lighthouse/i.test(nav.userAgent)) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'lighthouse' };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'reduced-motion' };
  const mobileInput = window.matchMedia('(pointer: coarse)').matches || nav.maxTouchPoints > 1;
  if (window.matchMedia('(max-width: 768px)').matches || mobileInput) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'mobile' };
  if (nav.connection?.saveData) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'save-data' };
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'low-memory' };
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) return { enabled: false, pixelRatio: 1, tier: 'static', reason: 'low-core' };
  const standard = (nav.deviceMemory !== undefined && nav.deviceMemory <= 8)
    || (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 8);
  const pixelRatioCap = standard ? 1.25 : 1.5;
  return {
    enabled: true,
    pixelRatio: Math.min(window.devicePixelRatio || 1, pixelRatioCap),
    tier: standard ? 'standard' : 'high',
    reason: 'desktop',
  };
}

export function useLanding3DQuality() {
  const [quality, setQuality] = useState(readQuality);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const update = () => setQuality(readQuality());
    motion.addEventListener('change', update);
    mobile.addEventListener('change', update);
    coarsePointer.addEventListener('change', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      motion.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
      coarsePointer.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return quality;
}
