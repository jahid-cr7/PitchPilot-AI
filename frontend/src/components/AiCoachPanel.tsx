import { useState } from "react";
import { pitchpilotApi } from "../api/pitchpilotApi";

export default function AiCoachPanel() {
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("Tell me about yourself.");
  const [role, setRole] = useState("Software Developer");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!transcript.trim()) {
      setError("Please enter a transcript or answer text.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await pitchpilotApi.analyzeAnswer({
        transcript,
        question,
        role,
        api_key: apiKey || null,
        base_url: baseUrl || null,
        model: model || null,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
        <h3 className="text-lg font-semibold text-white">AI Coach</h3>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Your Answer / Transcript</label>
          <textarea
            rows={6}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Paste your answer here..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Interview Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-200">
            Advanced settings (optional)
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="sk-..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
        </details>

        {error && (
          <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 disabled:opacity-60 transition"
        >
          {loading ? "Analyzing..." : "Run AI Coach"}
        </button>
      </div>

      {result && (
        <div className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-900/40 px-3 py-1 text-xs font-medium text-brand-300 border border-brand-700/40">
              Score: {(result.answer_score as number) ?? 0}/100
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-600/40">
              Status: {String(result.status)}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-600/40">
              Model: {String(result.model_used)}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Structure Feedback</h4>
            <p className="text-sm text-slate-300">{String(result.structure_feedback ?? "")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-emerald-300 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {((result.content_strengths as string[]) ?? []).map((s, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-300 mb-2">Weak Points</h4>
              <ul className="space-y-1">
                {((result.content_weak_points as string[]) ?? []).map((w, i) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Improved Answer</h4>
            <p className="text-sm text-slate-300">{String(result.improved_answer ?? "")}</p>
          </div>

          <div className="rounded-lg border border-brand-700/30 bg-brand-900/20 px-4 py-3">
            <p className="text-sm text-brand-200">
              <span className="font-semibold">Next Task:</span> {String(result.next_content_task ?? "")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
