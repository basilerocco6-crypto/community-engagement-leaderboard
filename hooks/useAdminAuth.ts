import { useState, useEffect } from 'react';

interface AdminAuthState {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: false,
    isLoading: true,
    error: null,
    user: null
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/check-access');
      const data = await response.json();

      if (response.ok && data.success) {
        setState({
          isAdmin: data.isAdmin,
          isLoading: false,
          error: null,
          user: data.user
        });
      } else {
        setState({
          isAdmin: false,
          isLoading: false,
          error: data.error || 'Access denied',
          user: null
        });
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setState({
        isAdmin: false,
        isLoading: false,
        error: 'Failed to verify admin access',
        user: null
      });
    }
  };

  const refreshAuth = () => {
    checkAdminAccess();
  };

  return {
    ...state,
    refreshAuth
  };
}
