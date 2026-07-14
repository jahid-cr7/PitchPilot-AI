import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: "blue" | "cyan" | "purple" | "green" | "amber" | "red";
  delay?: number;
}

const colorMap = {
  blue: "from-blue-500/20 to-blue-600/5 text-blue-400",
  cyan: "from-cyan-500/20 to-cyan-600/5 text-cyan-400",
  purple: "from-violet-500/20 to-violet-600/5 text-violet-400",
  green: "from-emerald-500/20 to-emerald-600/5 text-emerald-400",
  amber: "from-amber-500/20 to-amber-600/5 text-amber-400",
  red: "from-red-500/20 to-red-600/5 text-red-400",
};

export default function MetricCard({ title, value, subtitle, icon, color = "blue", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-slate-700/20 bg-[#111a2e]/80 p-5 shadow-xl shadow-black/10 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className={`inline-flex rounded-lg bg-gradient-to-br ${colorMap[color]} p-2`}>
          {icon}
        </div>
        {subtitle && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            {subtitle}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-extrabold text-[#e5edff]">{value}</div>
        <div className="mt-0.5 text-xs text-slate-400">{title}</div>
      </div>
    </motion.div>
  );
}
