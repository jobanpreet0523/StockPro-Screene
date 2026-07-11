import { useAuth } from '../contexts/AuthContext';

export function useAuthSession() {
  const auth = useAuth();
  return {
    user: auth.user,
    status: auth.authStatus,
    message: auth.authMessage,
    loading: auth.loading,
    refresh: auth.refreshSession,
    logout: auth.logout,
  };
}
