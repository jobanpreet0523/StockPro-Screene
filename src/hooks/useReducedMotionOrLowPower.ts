import { useEffect, useState } from 'react';

export function useReducedMotionOrLowPower() {
  const [shouldReduce, setShouldReduce] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || window.matchMedia('(max-width: 768px)').matches
      || (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined
        && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4;
  });

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');
    const update = () => {
      const lowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined
        && ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 4;
      setShouldReduce(reduced.matches || mobile.matches || lowMemory);
    };
    reduced.addEventListener('change', update);
    mobile.addEventListener('change', update);
    update();
    return () => {
      reduced.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
    };
  }, []);

  return shouldReduce;
}
