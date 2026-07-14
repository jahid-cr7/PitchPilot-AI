import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Target,
  MessageSquare,
  BarChart3,
  History,
  Settings,
  Zap,
  Crown,
  ChevronRight,
} from "lucide-react";

const NAV = [
  { label: "Home", path: "/", icon: Home },
  { label: "Practice", path: "/practice", icon: Target },
  { label: "Feedback", path: "/feedback", icon: MessageSquare },
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "History", path: "/history", icon: History },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-slate-700/20 bg-[#080f1e] md:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#e5edff]">PitchPilot AI</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Elite Coaching</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {NAV.map((n) => {
          const active = location.pathname === n.path;
          const Icon = n.icon;
          return (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-blue-500/15 to-violet-500/10 text-blue-300"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
              {n.label}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade card */}
      <div className="mx-4 mb-3 rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-violet-500/10 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
          <Crown className="h-3.5 w-3.5" />
          Upgrade to Pro
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Unlock full analysis & team features.</p>
        <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300">
          Learn more <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* User mini */}
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-slate-700/30 bg-slate-800/40 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-xs font-bold text-white">
          U
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-200">User</p>
          <p className="text-[10px] text-slate-500">Free Plan</p>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow shadow-emerald-400/40" />
      </div>
    </aside>
  );
}
