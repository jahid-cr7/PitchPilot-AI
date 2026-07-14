import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function MotionCard({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={`rounded-2xl border border-slate-700/20 bg-[#111a2e]/80 p-5 shadow-xl shadow-black/10 backdrop-blur-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}
