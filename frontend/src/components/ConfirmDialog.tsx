import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import GradientButton from "./GradientButton";

interface Props {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
}

export default function ConfirmDialog({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  open,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-slate-700/30 bg-[#111a2e] p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#e5edff]">{title}</h3>
            </div>
            <p className="mt-3 text-xs text-slate-400">{message}</p>
            <div className="mt-5 flex gap-2">
              <GradientButton variant="secondary" onClick={onCancel} className="flex-1">
                {cancelLabel}
              </GradientButton>
              <GradientButton onClick={onConfirm} className="flex-1">
                {confirmLabel}
              </GradientButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
