import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

interface Props {
  children: ReactNode;
  /** Optional friendly message shown as a toast when the guard triggers. */
  message?: string;
}

/**
 * Redirects unauthenticated users to /login while preserving the intended
 * destination so we can return them here after they sign in.
 */
export default function ProtectedRoute({ children, message }: Props) {
  const { isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const text = message || authError || "Please log in to access this page.";
      showToast(text, "info");
    }
  }, [isAuthenticated, isLoading, message, authError, showToast]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return <>{children}</>;
}
