'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMe, type UserProfile } from '@/lib/api';
import {
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  clearAllTokens,
  tokenExpiresIn,
  tryRefreshToken,
  apiRequest,
} from '@/lib/auth';
import { disconnectSocket } from '@/lib/socket';

// ─── Types ───

interface AuthContextValue {
  /** Current user profile (null if not authenticated) */
  user: UserProfile | null;
  /** True while the initial /auth/me request is in flight */
  isLoading: boolean;
  /** Shorthand: user is non-null */
  isAuthenticated: boolean;
  /** Store token(s) and refetch user profile */
  login: (accessToken: string, refreshToken?: string) => Promise<void>;
  /** Clear token, cache, and socket */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(
    () => typeof window !== 'undefined' && !!getAuthToken(),
  );

  const { data: user, isLoading, isError } = useMe(hasToken);

  // If /auth/me returns 401, clear stale tokens
  useEffect(() => {
    if (isError && hasToken) {
      clearAllTokens();
      setHasToken(false);
      queryClient.setQueryData(['me'], null);
    }
  }, [isError, hasToken, queryClient]);

  const login = useCallback(
    async (accessToken: string, refreshToken?: string) => {
      setAuthToken(accessToken);
      if (refreshToken) setRefreshToken(refreshToken);
      setHasToken(true);
      await queryClient.fetchQuery({
        queryKey: ['me'],
        queryFn: () => apiRequest<UserProfile>('/users/me'),
        staleTime: 0,
      });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    clearAllTokens();
    setHasToken(false);
    disconnectSocket();
    queryClient.clear();
    window.location.href = '/';
  }, [queryClient]);

  // ─── Auto-refresh timer ───
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasToken) return;

    function scheduleRefresh() {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      const expiresIn = tokenExpiresIn();
      if (expiresIn <= 0) return;
      // Refresh 60 seconds before expiry, minimum 5s
      const delay = Math.max((expiresIn - 60) * 1000, 5000);
      refreshTimer.current = setTimeout(async () => {
        const newToken = await tryRefreshToken();
        if (newToken) {
          scheduleRefresh();
        } else {
          // Refresh failed — force re-login
          clearAllTokens();
          setHasToken(false);
          disconnectSocket();
          queryClient.clear();
          window.location.href = '/login';
        }
      }, delay);
    }

    scheduleRefresh();
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [hasToken, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: hasToken && isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, hasToken, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ─── Hook ───

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
