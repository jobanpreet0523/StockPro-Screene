import type { DashboardTab } from './dashboardContext';

interface FloatingMotionDockProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export default function FloatingMotionDock(props: FloatingMotionDockProps) {
  void props;
  return null;
}
