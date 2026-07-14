import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Video, Camera, Mic2, BrainCircuit, BookOpen, FileText,
  ArrowRight, Sparkles, Eye, Upload, BarChart3, MessageSquare,
} from "lucide-react";
import MotionCard from "../components/MotionCard";
import ProgressBar from "../components/ProgressBar";
import ScoreRing from "../components/ScoreRing";
import GradientButton from "../components/GradientButton";
import PageTransition from "../components/PageTransition";

const FEATURES = [
  { icon: Video, title: "Video Analysis", desc: "OpenCV motion, duration, FPS & resolution.", color: "#60a5fa" },
  { icon: Camera, title: "Camera Presence", desc: "Face detection, framing & distance.", color: "#22d3ee" },
  { icon: Mic2, title: "Speech Analytics", desc: "Transcription, WPM, filler words.", color: "#8b5cf6" },
  { icon: BrainCircuit, title: "AI Coach", desc: "LLM content analysis with fallback.", color: "#22c55e" },
  { icon: BookOpen, title: "Question Bank", desc: "7 curated modes with random picker.", color: "#f59e0b" },
  { icon: FileText, title: "Reports", desc: "Professional HTML & CSV export.", color: "#ef4444" },
];

const STEPS = [
  { icon: Upload, title: "Upload Video", desc: "Drop an MP4 or use your webcam." },
  { icon: Eye, title: "Analyze Delivery", desc: "Video, camera & speech processed locally." },
  { icon: MessageSquare, title: "Get AI Feedback", desc: "Structured coaching on clarity & structure." },
  { icon: BarChart3, title: "Track Progress", desc: "Dashboard trends show improvement." },
];

export default function HomePage() {
  return (
    <PageTransition>
      <div className="space-y-8 md:space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-700/20 bg-gradient-to-br from-[#0d1b30] to-[#07111f] p-6 md:p-12">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-300"
              >
                <Sparkles className="h-3 w-3" />
                AI-Powered Interview Coach
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-extrabold leading-tight text-[#e5edff] md:text-5xl"
              >
                PitchPilot AI
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-lg text-sm leading-relaxed text-slate-400"
              >
                Practice smarter with AI-powered interview and presentation coaching.
                Master your delivery with real-time feedback that feels like a human expert.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-3"
              >
                <Link to="/practice">
                  <GradientButton>Start Practice</GradientButton>
                </Link>
                <Link to="/dashboard">
                  <GradientButton variant="secondary">View Dashboard</GradientButton>
                </Link>
              </motion.div>
            </div>

            <div className="relative flex flex-1 flex-wrap items-center justify-center gap-4 lg:justify-end">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl border border-slate-700/20 bg-[#111a2e]/90 p-5 shadow-2xl shadow-black/20"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Tone Analysis</div>
                <ProgressBar value={78} max={100} color="#22d3ee" label="Confidence" delay={0.6} />
                <ProgressBar value={65} max={100} color="#8b5cf6" label="Clarity" delay={0.8} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700/20 bg-[#111a2e]/90 p-5 shadow-2xl shadow-black/20"
              >
                <ScoreRing score={94} size={90} strokeWidth={8} label="Clarity" delay={0.6} />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Eye Contact</div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < 9 ? "bg-cyan-400" : "bg-slate-700"}`} />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="mb-4 text-base font-bold text-[#e5edff] md:text-lg">Key Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <MotionCard key={f.title} delay={i * 0.05}>
                <div className="mb-3 inline-flex rounded-lg p-2" style={{ background: `${f.color}15`, color: f.color }}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-[#e5edff]">{f.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{f.desc}</p>
              </MotionCard>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="rounded-3xl border border-slate-700/20 bg-[#0d1b30]/50 p-6 md:p-8">
          <h2 className="mb-6 text-base font-bold text-[#e5edff] md:text-lg">How It Works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative flex flex-col items-start gap-3 rounded-2xl border border-slate-700/20 bg-[#111a2e]/60 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-400">
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#e5edff]">{s.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-blue-500/15 bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-6 sm:flex-row md:p-8"
        >
          <div>
            <h3 className="text-base font-bold text-[#e5edff] md:text-lg">Ready to ace your next pitch?</h3>
            <p className="mt-1 text-sm text-slate-400">Start practicing with AI coaching today.</p>
          </div>
          <Link to="/practice">
            <GradientButton>Get Started Free</GradientButton>
          </Link>
        </motion.section>
      </div>
    </PageTransition>
  );
}
