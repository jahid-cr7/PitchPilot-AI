import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, LogIn, Mail, Lock, Zap } from "lucide-react";
import { AuthApiError } from "../api/authApi";
import GradientButton from "../components/GradientButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

interface LocationState {
  from?: string;
  message?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, isAuthenticated, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LocationState | null)?.from || "/dashboard";
  const incomingMessage = (location.state as LocationState | null)?.message;

  // If a session-expired message came from AuthContext, surface it here.
  useEffect(() => {
    if (incomingMessage) {
      setError(incomingMessage);
      return;
    }
    if (authError) {
      setError(authError);
    }
  }, [authError, incomingMessage]);

  // If somehow rendered while already authenticated, bounce forward.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      clearAuthError();
      showToast(`Welcome back, ${user.name}!`, "success");
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111f] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-slate-700/25 bg-gradient-to-br from-[#0d1b30] to-[#07111f] p-8 shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#e5edff]">Welcome back</h1>
            <p className="text-xs text-slate-400">
              Sign in to continue your practice history.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-400"
            >
              Email
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 pl-9 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-400"
            >
              Password
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 pl-9 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <GradientButton type="submit" disabled={submitting} className="w-full">
            <LogIn className="mr-1.5 inline h-3.5 w-3.5" />
            {submitting ? "Signing in..." : "Sign in"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          New to PitchPilot?{" "}
          <Link
            to="/register"
            state={{ from }}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] text-slate-600">
          <Link to="/" className="hover:text-slate-400">
            &larr; Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
