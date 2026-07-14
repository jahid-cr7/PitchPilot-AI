import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { pitchpilotApi } from "../api/pitchpilotApi";

export default function ApiStatusBadge() {
  const [status, setStatus] = useState<"online" | "offline" | "checking">("checking");

  async function check() {
    setStatus("checking");
    try {
      const res = await pitchpilotApi.getHealth();
      setStatus(res.status === "ok" ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const map = {
    online: { color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", label: "Backend Online" },
    offline: { color: "text-red-300 bg-red-500/10 border-red-500/20", dot: "bg-red-400", label: "Backend Offline" },
    checking: { color: "text-slate-300 bg-slate-700/20 border-slate-600/20", dot: "bg-slate-400 animate-pulse", label: "Checking..." },
  };

  const s = map[status];

  return (
    <button
      onClick={check}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${s.color}`}
    >
      <RefreshCw className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`} />
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </button>
  );
}
