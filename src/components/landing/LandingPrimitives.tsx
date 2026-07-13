import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { captureSafeEvent, type SafeAnalyticsEvent } from '../../lib/posthog';

export type ReadinessTone = 'ready' | 'setup' | 'login' | 'pending' | 'disabled' | 'unavailable' | 'free';

const readinessClasses: Record<ReadinessTone, string> = {
  ready: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  setup: 'border-amber-300 bg-amber-50 text-amber-900',
  login: 'border-blue-300 bg-blue-50 text-blue-800',
  pending: 'border-orange-300 bg-orange-50 text-orange-900',
  disabled: 'border-slate-300 bg-slate-100 text-slate-700',
  unavailable: 'border-rose-300 bg-rose-50 text-rose-800',
  free: 'border-teal-300 bg-teal-50 text-teal-800',
};

export function ReadinessPill({ children, tone = 'setup' }: { children: ReactNode; tone?: ReadinessTone }) {
  return <span className={`inline-flex min-h-7 items-center border px-2.5 py-1 text-[10px] font-black uppercase ${readinessClasses[tone]}`}>{children}</span>;
}

export function SectionHeading({ eyebrow, title, copy, id, aside }: { eyebrow: string; title: string; copy: string; id: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase text-blue-700">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">{copy}</p>
      </div>
      {aside}
    </div>
  );
}

type TrackedLinkProps = LinkProps & {
  event?: SafeAnalyticsEvent;
  icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  showArrow?: boolean;
};

export function TrackedLink({ event, icon: Icon, showArrow = false, children, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(clickEvent) => {
        if (event) captureSafeEvent(event);
        onClick?.(clickEvent);
      }}
    >
      {Icon && <Icon size={16} aria-hidden />}
      <span>{children}</span>
      {showArrow && <ArrowRight size={15} aria-hidden />}
    </Link>
  );
}

export function useVisibleOnce<T extends Element>(rootMargin = '240px') {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return { ref, visible };
}

