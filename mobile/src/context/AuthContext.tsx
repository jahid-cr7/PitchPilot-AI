/**
 * AuthContext (mobile)
 * ====================
 * React context that owns the auth token + user state for the Expo app.
 *
 * - JWT + serialized user are persisted with AsyncStorage under:
 *     pitchpilot_auth_token
 *     pitchpilot_auth_user
 * - The pitchpilotApi client is wired at startup so every protected request
 *   sends `Authorization: Bearer <token>`, and any 401 from the backend clears
 *   local state and surfaces a friendly message.
 * - Passwords are never stored; they are only sent to the backend on the
 *   login/register call.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthApiError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../api/authApi';
import {
  setAuthTokenProvider,
  setUnauthorizedHandler,
} from '../api/pitchpilotApi';
import type { AuthUser } from '../types/pitchpilot';

export const AUTH_TOKEN_KEY = 'pitchpilot_auth_token';
export const AUTH_USER_KEY = 'pitchpilot_auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: (reason?: string) => Promise<void>;
  refreshMe: () => Promise<AuthUser | null>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cached synchronously so the API client can inject the header at any time
  // without awaiting AsyncStorage.
  const tokenRef = useRef<string | null>(null);
  const logoutRef = useRef<(reason?: string) => Promise<void>>(async () => {});

  const persistToken = useCallback(async (value: string | null) => {
    tokenRef.current = value;
    setToken(value);
    if (value) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, value);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, []);

  const persistUser = useCallback(async (value: AuthUser | null) => {
    setUser(value);
    if (value) {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(value));
    } else {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  const logout = useCallback(
    async (reason?: string) => {
      const current = tokenRef.current;
      if (current) {
        // Fire-and-forget; ignore network errors during sign-out.
        void logoutUser(current);
      }
      await persistToken(null);
      await persistUser(null);
      setAuthError(reason ?? null);
    },
    [persistToken, persistUser]
  );

  logoutRef.current = logout;

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    const current = tokenRef.current;
    if (!current) {
      return null;
    }
    try {
      const me = await getCurrentUser(current);
      await persistUser(me);
      setAuthError(null);
      return me;
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        await persistToken(null);
        await persistUser(null);
        setAuthError('Your session expired. Please log in again.');
      }
      return null;
    }
  }, [persistToken, persistUser]);

  // Bootstrap on mount: hydrate token/user from AsyncStorage, then verify.
  useEffect(() => {
    let cancelled = false;

    // Wire the shared API client to read the current token and to react to 401s.
    setAuthTokenProvider(() => tokenRef.current);
    setUnauthorizedHandler(() => {
      void logoutRef.current('Your session expired. Please log in again.');
    });

    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (cancelled) return;

        if (storedToken) {
          tokenRef.current = storedToken;
          setToken(storedToken);
        }
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser) as AuthUser);
          } catch {
            await AsyncStorage.removeItem(AUTH_USER_KEY);
          }
        }

        if (storedToken) {
          await refreshMe();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setAuthTokenProvider(null);
      setUnauthorizedHandler(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setAuthError(null);
      const res = await loginUser(email, password);
      await persistToken(res.access_token);
      await persistUser(res.user);
      return res.user;
    },
    [persistToken, persistUser]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      setAuthError(null);
      const res = await registerUser(name, email, password);
      await persistToken(res.access_token);
      await persistUser(res.user);
      return res.user;
    },
    [persistToken, persistUser]
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
      authError,
      clearAuthError,
    }),
    [user, token, isLoading, login, register, logout, refreshMe, authError, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
