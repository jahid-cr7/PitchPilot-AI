import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  status: "active" | "standby" | "error" | "success" | "warning";
}

const statusStyles = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  standby: "border-slate-600/25 bg-slate-700/20 text-slate-400",
  error: "border-red-500/25 bg-red-500/10 text-red-300",
  success: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-300",
};

export default function StatusBadge({ children, status }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "animate-pulse bg-emerald-400" : status === "error" ? "bg-red-400" : status === "success" ? "bg-blue-400" : status === "warning" ? "bg-amber-400" : "bg-slate-400"}`} />
      {children}
    </span>
  );
}
