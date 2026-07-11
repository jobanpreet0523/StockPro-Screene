import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../../hooks/useAuthSession';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, status, loading } = useAuthSession();
  const location = useLocation();

  if (loading) return <div className="p-6 text-sm font-semibold text-slate-500">Checking account session...</div>;
  if (status === 'setup_required') {
    return <div className="border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">Account access requires Supabase Auth setup. No user session is assumed.</div>;
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
