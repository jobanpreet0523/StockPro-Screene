import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Flame, Newspaper, Radar, WandSparkles } from 'lucide-react';
import type { DashboardTab } from './Layout';

interface FloatingMotionDockProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const actions: { label: string; tab: DashboardTab; icon: React.ElementType }[] = [
  { label: 'Screener', tab: 'screener', icon: BarChart3 },
  { label: 'Signals', tab: 'signals', icon: WandSparkles },
  { label: 'Heatmap', tab: 'heatmap', icon: Flame },
  { label: 'Options', tab: 'fo', icon: Radar },
  { label: 'News', tab: 'news', icon: Newspaper },
];

export default function FloatingMotionDock({ activeTab, setActiveTab }: FloatingMotionDockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}
      className="fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/70 bg-white/80 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/75 dark:shadow-emerald-950/20 md:flex"
      id="floating_motion_dock"
    >
      {actions.map(action => {
        const Icon = action.icon;
        const active = activeTab === action.tab;
        return (
          <motion.button
            key={action.tab}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(action.tab)}
            className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition ${
              active
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId="dock-active-pill"
                className="absolute inset-0 rounded-xl bg-emerald-100 shadow-sm dark:bg-emerald-500/20"
                transition={{ type: 'spring', stiffness: 430, damping: 34 }}
              />
            )}
            <Icon size={15} className="relative z-10" />
            <span className="relative z-10">{action.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
