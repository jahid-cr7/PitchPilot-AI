import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const iconMap = {
    success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    error: <AlertTriangle className="h-4 w-4 text-red-400" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    info: <Info className="h-4 w-4 text-blue-400" />,
  };

  const borderMap = {
    success: "border-emerald-500/20 bg-emerald-500/10",
    error: "border-red-500/20 bg-red-500/10",
    warning: "border-amber-500/20 bg-amber-500/10",
    info: "border-blue-500/20 bg-blue-500/10",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${borderMap[t.type]}`}
            >
              {iconMap[t.type]}
              <span className="text-xs font-medium text-slate-200">{t.message}</span>
              <button onClick={() => remove(t.id)} className="ml-2 text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
