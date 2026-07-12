import { Link, useLocation } from "react-router-dom";

const NAV = [
  { label: "Home", path: "/" },
  { label: "Practice", path: "/practice" },
  { label: "Feedback", path: "/feedback" },
  { label: "Settings", path: "/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-extrabold">
              PP
            </span>
            PitchPilot AI
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                className={
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors " +
                  (location.pathname === n.path
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white")
                }
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="sm:hidden flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                className={
                  "px-2 py-1.5 rounded-md text-xs font-medium transition-colors " +
                  (location.pathname === n.path
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white")
                }
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
