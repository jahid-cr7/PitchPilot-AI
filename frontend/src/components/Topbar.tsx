import { Search, Bell, Zap, LogOut, LogIn, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ApiStatusBadge from "./ApiStatusBadge";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/practice": "Practice Lab",
  "/feedback": "Session Feedback",
  "/dashboard": "Analytics Dashboard",
  "/history": "Session History",
  "/settings": "System Settings",
};

function initialsOf(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || first.toUpperCase() || "U";
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  const title = PAGE_TITLES[location.pathname] || "PitchPilot AI";

  async function handleLogout() {
    await logout();
    showToast("You have been signed out.", "info");
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700/20 bg-[#07111f]/90 px-4 py-3 backdrop-blur-md md:px-6">
      <h2 className="text-sm font-semibold text-[#e5edff] md:text-base">{title}</h2>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-xl border border-slate-700/30 bg-slate-800/40 px-3 py-2 sm:flex">
          <Search className="h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search sessions..."
            className="w-32 bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none lg:w-40"
          />
        </div>

        {/* Backend Status */}
        <ApiStatusBadge />

        {/* Notification */}
        <button className="relative rounded-lg border border-slate-700/30 bg-slate-800/40 p-2 text-slate-400 hover:text-slate-200 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#07111f]" />
        </button>

        {/* Lightning */}
        <button className="rounded-lg border border-slate-700/30 bg-slate-800/40 p-2 text-slate-400 hover:text-amber-300 transition">
          <Zap className="h-4 w-4" />
        </button>

        {/* Auth block */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-slate-200 leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
              {initialsOf(user.name)}
            </div>
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 md:inline-flex"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-700/30 bg-slate-800/40 p-2 text-slate-400 hover:text-slate-200 md:hidden"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/30 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
