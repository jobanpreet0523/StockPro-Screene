import { useState } from 'react';
import ProLayout from '../components/pro/ProLayout';
import type { ProSection } from '../components/pro/ProSidebar';
import ProDashboard from '../components/pro/ProDashboard';
import ProWatchlist from '../components/pro/ProWatchlist';
import ProIdeas from '../components/pro/ProIdeas';
import ProScreener from '../components/pro/ProScreener';
import ProDataExplorer from '../components/pro/ProDataExplorer';
import ProCharts from '../components/pro/ProCharts';
import ProSavedWork from '../components/pro/ProSavedWork';
import ProAiResearch from '../components/pro/ProAiResearch';
import ProGettingStarted from '../components/pro/ProGettingStarted';
import { useProAccess } from '../hooks/useProAccess';
import { captureSafeEvent } from '../lib/posthog';

const panels: Record<ProSection, React.ComponentType> = {
  dashboard: ProDashboard,
  watchlist: ProWatchlist,
  ideas: ProIdeas,
  screener: ProScreener,
  data: ProDataExplorer,
  charts: ProCharts,
  saved: ProSavedWork,
  ai: ProAiResearch,
  'getting-started': ProGettingStarted,
};

export default function ProPage() {
  const [section, setSection] = useState<ProSection>('dashboard');
  const access = useProAccess();
  const Panel = panels[section];

  return (
    <div className="lg:col-span-12">
      <ProLayout active={section} onSelect={(next) => { setSection(next); captureSafeEvent('pro_tab_click'); }}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">Access</p>
            <p className="text-sm font-black">{access.loading ? 'checking' : access.tier.replace('_', ' ')}</p>
          </div>
          <p className="max-w-2xl text-xs font-semibold text-slate-600">{access.message}</p>
        </div>
        <Panel />
        <footer className="mt-6 border-t border-slate-200 pt-4 text-xs font-semibold leading-5 text-slate-500">
          StockPro provides educational analytics and research tools only. It does not provide investment advice, buy/sell recommendations, guaranteed returns, or trade execution.
        </footer>
      </ProLayout>
    </div>
  );
}
