import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 to-slate-900 border border-slate-700/50">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-400 via-transparent to-transparent" />
      <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Practice smarter. <span className="text-brand-400">Interview better.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
          PitchPilot AI analyzes your practice interviews across body language, camera presence,
          speech clarity, and answer content — then gives you structured feedback and a score.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/practice"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-500 transition"
          >
            Start Practice
          </Link>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
          >
            View API Docs
          </a>
        </div>
      </div>
    </section>
  );
}
