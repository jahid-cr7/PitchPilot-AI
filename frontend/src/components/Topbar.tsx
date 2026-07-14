import { Search, Bell, Zap } from "lucide-react";
import { useLocation } from "react-router-dom";
import ApiStatusBadge from "./ApiStatusBadge";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/practice": "Practice Lab",
  "/feedback": "Session Feedback",
  "/dashboard": "Analytics Dashboard",
  "/history": "Session History",
  "/settings": "System Settings",
};

export default function Topbar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "PitchPilot AI";

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

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
          U
        </div>
      </div>
    </header>
  );
}
