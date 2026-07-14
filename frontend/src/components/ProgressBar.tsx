import { motion } from "framer-motion";

interface Props {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  delay?: number;
}

export default function ProgressBar({ value, max = 100, color = "#60a5fa", label, delay = 0 }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="font-medium text-slate-300">{value}</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/30">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
