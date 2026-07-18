import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Mail, Lock, User, Zap, UserPlus } from "lucide-react";
import { AuthApiError } from "../api/authApi";
import GradientButton from "../components/GradientButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

interface LocationState {
  from?: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LocationState | null)?.from || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in every field.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const user = await register(name.trim(), email.trim(), password);
      showToast(`Account created. Welcome, ${user.name}!`, "success");
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
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
            <h1 className="text-lg font-bold text-[#e5edff]">Create your account</h1>
            <p className="text-xs text-slate-400">
              Save your practice history and track your progress.
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-slate-400">
              Name
            </label>
            <div className="relative mt-2">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                placeholder="Jahid Hasan"
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 pl-9 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-400">
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
            <label htmlFor="password" className="block text-xs font-medium text-slate-400">
              Password
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 pl-9 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 placeholder:text-slate-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="block text-xs font-medium text-slate-400">
              Confirm password
            </label>
            <div className="relative mt-2">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
                placeholder="Repeat your password"
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
            <UserPlus className="mr-1.5 inline h-3.5 w-3.5" />
            {submitting ? "Creating account..." : "Create account"}
          </GradientButton>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ from }}
            className="font-medium text-blue-400 hover:text-blue-300"
          >
            Sign in
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
