import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Activity } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 border border-dashed border-rose-200 dark:border-rose-900/50 rounded-xl flex flex-col items-center justify-center text-center">
          <Activity size={24} className="text-rose-500 mb-2" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-rose-400 mb-1">Component Offline</h3>
          <p className="text-xs text-slate-500 font-mono mb-4">Pipeline anomaly isolated. Rest of dashboard remains operational.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            Attempt Recovery
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
