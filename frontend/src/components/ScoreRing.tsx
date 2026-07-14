import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  delay?: number;
}

export default function ScoreRing({ score, size = 140, strokeWidth = 10, label = "Score", delay = 0 }: Props) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), delay * 1000 + 200);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-2xl font-extrabold text-[#e5edff]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.4 }}
        >
          {animated}
        </motion.span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
      </div>
    </div>
  );
}
