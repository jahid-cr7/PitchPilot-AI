import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}

export default function GradientButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: Props) {
  const base =
    variant === "primary"
      ? "relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25"
      : variant === "secondary"
      ? "rounded-xl border border-slate-700/40 bg-slate-800/60 px-5 py-2.5 text-sm font-medium text-slate-300"
      : "rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200";

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`${base} transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </motion.button>
  );
}
