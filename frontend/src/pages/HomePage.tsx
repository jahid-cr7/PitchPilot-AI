import Hero from "../components/Hero";
import ScoreCard from "../components/ScoreCard";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🎬",
    title: "Video Analysis",
    desc: "OpenCV-powered motion analysis, duration, FPS, and resolution extraction.",
  },
  {
    icon: "📷",
    title: "Camera Presence",
    desc: "Face detection, framing analysis, distance feedback, and movement scoring.",
  },
  {
    icon: "🎤",
    title: "Speech Analytics",
    desc: "faster-whisper transcription with WPM, filler words, and repetition counts.",
  },
  {
    icon: "🤖",
    title: "AI Coach",
    desc: "LLM-powered content analysis with intelligent offline fallback.",
  },
  {
    icon: "📊",
    title: "Progress Dashboard",
    desc: "Trend charts, KPIs, and component breakdowns from your session history.",
  },
  {
    icon: "📥",
    title: "Report Export",
    desc: "Professional HTML and CSV reports for sharing and archiving.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <Hero />

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Key Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-5 hover:border-brand-700/60 transition"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-6">
        <h2 className="text-lg font-bold text-white mb-3">Quick Stats</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <ScoreCard title="Practice Modes" value={7} subtitle="curated question banks" />
          <ScoreCard title="Dimensions" value={4} subtitle="video, camera, speech, answer" />
          <ScoreCard title="Score Range" value="0–100" subtitle="weighted overall" />
          <ScoreCard title="Offline Ready" value="Yes" subtitle="rule-based fallback" />
        </div>
      </section>

      <section className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 p-6">
        <div>
          <h3 className="font-semibold text-white">Ready to practice?</h3>
          <p className="text-sm text-slate-400">Pick a mode, choose a question, and get coached.</p>
        </div>
        <Link
          to="/practice"
          className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition"
        >
          Start Practice
        </Link>
      </section>
    </div>
  );
}
