import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { canUseFeature, proFeatureDetails, type PlanTier, type ProFeature } from '../core/proAccess';

interface ProFeatureGateProps {
  plan: PlanTier;
  feature: ProFeature;
  children?: ReactNode;
  className?: string;
}

export default function ProFeatureGate({ plan, feature, children, className = '' }: ProFeatureGateProps) {
  const access = canUseFeature(plan, feature);
  if (access.allowed) return <>{children}</>;

  const details = proFeatureDetails[feature];

  return (
    <article className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <LockKeyhole size={16} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-950 dark:text-white">{details.name}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{details.description}</p>
        </div>
      </div>
      <Link
        to={access.upgradePath}
        data-analytics-event="waitlist_click"
        data-analytics-label={`${details.name} access request`}
        className="mt-4 inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
      >
        Request access
      </Link>
    </article>
  );
}
