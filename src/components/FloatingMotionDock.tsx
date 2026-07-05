import type { DashboardTab } from './Layout';

interface FloatingMotionDockProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

export default function FloatingMotionDock(props: FloatingMotionDockProps) {
  void props;
  return null;
}
