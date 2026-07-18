/**
 * AuthContext
 * ============
 * React context that owns the auth token + user state and exposes login /
 * register / logout / refreshMe helpers.
 *
 * - JWT is persisted in localStorage under `pitchpilot_auth_token`.
 * - The API client (`pitchpilotApi`) is wired to read the same key so protected
 *   requests always send `Authorization: Bearer <token>` without prop drilling.
 * - Passwords are never persisted; they are only sent to the backend once per
 *   login/register call.
 */

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AuthApiError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../api/authApi";
import { pitchpilotApi } from "../api/pitchpilotApi";
import type { AuthUser } from "../types/pitchpilot";

export const AUTH_TOKEN_KEY = "pitchpilot_auth_token";
export const AUTH_USER_KEY = "pitchpilot_auth_user";

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

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [user, setUserState] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(!!token);
  const [authError, setAuthError] = useState<string | null>(null);
  const clearOnUnauthorizedRef = useRef<() => void>(() => {});

  const persistToken = useCallback((value: string | null) => {
    if (value) {
      localStorage.setItem(AUTH_TOKEN_KEY, value);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setTokenState(value);
  }, []);

  const persistUser = useCallback((value: AuthUser | null) => {
    if (value) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    setUserState(value);
  }, []);

  const logout = useCallback(
    async (reason?: string) => {
      const current = localStorage.getItem(AUTH_TOKEN_KEY);
      if (current) {
        // Fire-and-forget; do not await network errors during sign-out.
        void logoutUser(current);
      }
      persistToken(null);
      persistUser(null);
      setAuthError(reason ?? null);
    },
    [persistToken, persistUser],
  );

  clearOnUnauthorizedRef.current = () => {
    void logout("Your session expired. Please log in again.");
  };

  // Wire the shared API client so protected calls include the JWT header and
  // an HTTP 401 automatically clears local auth state.
  useEffect(() => {
    pitchpilotApi.setAuthTokenProvider(() => localStorage.getItem(AUTH_TOKEN_KEY));
    pitchpilotApi.setUnauthorizedHandler(() => {
      clearOnUnauthorizedRef.current();
    });
  }, []);

  const refreshMe = useCallback(async (): Promise<AuthUser | null> => {
    const current = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!current) {
      setIsLoading(false);
      return null;
    }
    try {
      const me = await getCurrentUser(current);
      persistUser(me);
      setAuthError(null);
      return me;
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 401) {
        persistToken(null);
        persistUser(null);
        setAuthError("Your session expired. Please log in again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [persistToken, persistUser]);

  // On mount, if we have a stored token, verify it against /auth/me.
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    void refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setAuthError(null);
      const res = await loginUser(email, password);
      persistToken(res.access_token);
      persistUser(res.user);
      return res.user;
    },
    [persistToken, persistUser],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      setAuthError(null);
      const res = await registerUser(name, email, password);
      persistToken(res.access_token);
      persistUser(res.user);
      return res.user;
    },
    [persistToken, persistUser],
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
    [user, token, isLoading, login, register, logout, refreshMe, authError, clearAuthError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
