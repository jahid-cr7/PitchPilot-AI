import { motion } from "framer-motion";
import {
  Upload,
  Video,
  Camera,
  Mic2,
  Sparkles,
  Trophy,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export type AnalysisStep =
  | "uploading"
  | "video"
  | "camera"
  | "speech"
  | "ai"
  | "final"
  | "done";

interface Props {
  step: AnalysisStep;
}

const STEPS: { key: AnalysisStep; label: string; icon: React.ReactNode }[] = [
  { key: "uploading", label: "Uploading", icon: <Upload className="h-4 w-4" /> },
  { key: "video", label: "Video Analysis", icon: <Video className="h-4 w-4" /> },
  { key: "camera", label: "Camera Analysis", icon: <Camera className="h-4 w-4" /> },
  { key: "speech", label: "Speech Analysis", icon: <Mic2 className="h-4 w-4" /> },
  { key: "ai", label: "AI Feedback", icon: <Sparkles className="h-4 w-4" /> },
  { key: "final", label: "Final Score", icon: <Trophy className="h-4 w-4" /> },
];

function stepIndex(step: AnalysisStep): number {
  if (step === "done") return STEPS.length;
  return STEPS.findIndex((s) => s.key === step);
}

export default function AnalysisProgress({ step }: Props) {
  const current = stepIndex(step);

  return (
    <div className="space-y-3">
      {STEPS.map((s, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
              isActive
                ? "border-blue-500/30 bg-blue-500/10"
                : isDone
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-slate-700/20 bg-slate-800/30"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isActive
                  ? "bg-blue-500/20 text-blue-400"
                  : isDone
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/30 text-slate-500"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                s.icon
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                isActive
                  ? "text-blue-300"
                  : isDone
                  ? "text-emerald-300"
                  : "text-slate-500"
              }`}
            >
              {s.label}
            </span>
            {isActive && (
              <motion.div
                className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
