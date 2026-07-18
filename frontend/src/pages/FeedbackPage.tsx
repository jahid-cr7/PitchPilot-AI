import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  ArrowLeft,
  LayoutDashboard,
  History,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Copy,
  FileText,
  Sparkles,
  Mic2,
  Video,
  Camera,
  Zap,
  ChevronRight,
} from "lucide-react";
import { pitchpilotApi } from "../api/pitchpilotApi";
import { useToast } from "../components/Toast";
import MotionCard from "../components/MotionCard";
import ScoreRing from "../components/ScoreRing";
import ProgressBar from "../components/ProgressBar";
import GradientButton from "../components/GradientButton";
import EmptyState from "../components/EmptyState";

interface StoredAnalysis {
  result: Record<string, unknown>;
  meta: {
    fileName: string;
    question: string;
    role: string;
    mode: string;
    analyzedAt: string;
    sessionId: number | null;
  };
}

function loadAnalysis(): StoredAnalysis | null {
  try {
    const raw = localStorage.getItem("pp_last_analysis");
    return raw ? (JSON.parse(raw) as StoredAnalysis) : null;
  } catch {
    return null;
  }
}

function getPerformanceBadge(level: string) {
  const l = String(level).toLowerCase();
  if (l.includes("excellent"))
    return {
      text: level || "Excellent",
      class: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      icon: <CheckCircle className="h-3 w-3" />,
    };
  if (l.includes("good"))
    return {
      text: level || "Good",
      class: "border-blue-500/20 bg-blue-500/10 text-blue-300",
      icon: <TrendingUp className="h-3 w-3" />,
    };
  return {
    text: level || "Needs Work",
    class: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    icon: <AlertTriangle className="h-3 w-3" />,
  };
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [exporting, setExporting] = useState<"html" | "csv" | null>(null);

  // AI Coach state (secondary feature)
  const [transcript, setTranscript] = useState("");
  const [question, setQuestion] = useState("Tell me about yourself.");
  const [role, setRole] = useState("Software Developer");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = loadAnalysis();
    if (stored) {
      setAnalysis(stored);
      setQuestion(stored.meta.question);
      setRole(stored.meta.role);
      // Pre-fill transcript if available in result
      const speech = stored.result.speech_result as Record<string, unknown> | undefined;
      if (speech?.transcript) {
        setTranscript(String(speech.transcript));
      }
    }
  }, []);

  const fb = (analysis?.result?.final_feedback as Record<string, unknown>) || {};
  const ai = (analysis?.result?.ai_result as Record<string, unknown>) || {};
  const overallScore = (fb.overall_score as number) ?? 0;
  const videoScore = (fb.video_score as number) ?? 0;
  const cameraScore = (fb.camera_score as number) ?? 0;
  const speechScore = (fb.speech_score as number) ?? 0;
  const answerScore = (fb.answer_score as number) ?? 0;
  const performanceLevel = String(fb.performance_level ?? "");
  const strengths = (fb.strengths as string[]) ?? [];
  const weakPoints = (fb.weak_points as string[]) ?? [];
  const nextTask = String(fb.next_practice_task ?? "");
  const summary = String(fb.summary ?? "");
  const transcriptPreview = String(fb.transcript ?? ai.transcript ?? transcript ?? "");
  const modelUsed = String(ai.model_used ?? fb.model_used ?? "—");

  const badge = getPerformanceBadge(performanceLevel);
  const sessionId = analysis?.meta.sessionId ?? null;
  const saveWarning = String(analysis?.result?.save_warning ?? "");

  async function handleExportHtml() {
    const sid = analysis?.meta.sessionId;
    if (!sid) return;
    setExporting("html");
    try {
      const data = await pitchpilotApi.exportHtmlReport(sid);
      downloadFile(data.content, data.filename, "text/html");
      showToast("HTML report downloaded.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportCsv() {
    const sid = analysis?.meta.sessionId;
    if (!sid) return;
    setExporting("csv");
    try {
      const data = await pitchpilotApi.exportCsvReport(sid);
      downloadFile(data.content, data.filename, "text/csv");
      showToast("CSV report downloaded.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    } finally {
      setExporting(null);
    }
  }

  async function handleAiCoach() {
    if (!transcript.trim()) {
      setAiError("Enter a transcript.");
      return;
    }
    setAiError("");
    setAiLoading(true);
    try {
      const res = await pitchpilotApi.analyzeAnswer({
        transcript,
        question,
        role,
        api_key: apiKey || null,
        base_url: baseUrl || null,
        model: model || null,
      });
      setAiResult(res);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setAiLoading(false);
    }
  }

  const improved = String(aiResult?.improved_answer ?? "");
  function copyImproved() {
    if (improved) {
      navigator.clipboard.writeText(improved).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  if (!analysis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Session Feedback</h1>
          <p className="text-xs text-slate-400">View your full analysis results.</p>
        </div>
        <EmptyState
          title="No analysis yet"
          message="Run a full analysis on the Practice page to see your feedback here."
          action={
            <GradientButton onClick={() => navigate("/practice")}>
              Go to Practice
            </GradientButton>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Session Feedback</h1>
          <p className="text-xs text-slate-400">
            {analysis.meta.fileName} — {new Date(analysis.meta.analyzedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sessionId ? (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle className="h-3 w-3" />
                Saved to History
              </div>
              <GradientButton
                variant="secondary"
                onClick={handleExportHtml}
                disabled={exporting === "html"}
              >
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                {exporting === "html" ? "Exporting…" : "Export HTML"}
              </GradientButton>
              <GradientButton
                variant="secondary"
                onClick={handleExportCsv}
                disabled={exporting === "csv"}
              >
                <Download className="mr-1.5 inline h-3.5 w-3.5" />
                {exporting === "csv" ? "Exporting…" : "Export CSV"}
              </GradientButton>
            </>
          ) : saveWarning ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              {saveWarning}
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300">
              Analysis complete. Save-to-history endpoint will be added next.
            </div>
          )}
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div className="flex flex-wrap gap-2">
        <GradientButton variant="secondary" onClick={() => navigate("/practice")}>
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" /> Back to Practice
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => navigate("/dashboard")}>
          <LayoutDashboard className="mr-1.5 inline h-3.5 w-3.5" /> View Dashboard
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => navigate("/history")}>
          <History className="mr-1.5 inline h-3.5 w-3.5" /> View History
        </GradientButton>
        {sessionId && (
          <GradientButton variant="ghost" onClick={() => navigate(`/history`)}>
            <ChevronRight className="mr-1.5 inline h-3.5 w-3.5" /> Open in History
          </GradientButton>
        )}
      </div>

      {/* Main Score */}
      <div className="grid gap-5 lg:grid-cols-3">
        <MotionCard className="flex flex-col items-center justify-center lg:col-span-1">
          <ScoreRing score={overallScore} size={160} strokeWidth={12} label="Overall" />
          <div
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badge.class}`}
          >
            {badge.icon}
            {badge.text}
          </div>
          {summary && (
            <p className="mt-2 text-center text-[11px] text-slate-400">{summary}</p>
          )}
        </MotionCard>

        <div className="space-y-4 lg:col-span-2">
          <MotionCard delay={0.05}>
            <h4 className="text-xs font-semibold text-[#e5edff]">Dimension Breakdown</h4>
            <div className="mt-3 space-y-3">
              <ProgressBar value={videoScore} max={100} color="#60a5fa" label="Video" />
              <ProgressBar value={cameraScore} max={100} color="#22d3ee" label="Camera" />
              <ProgressBar value={speechScore} max={100} color="#8b5cf6" label="Speech" />
              <ProgressBar value={answerScore} max={100} color="#22c55e" label="Answer" />
            </div>
          </MotionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <MotionCard delay={0.1}>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5" /> Strengths
              </div>
              <ul className="mt-2 space-y-1.5">
                {strengths.length > 0 ? (
                  strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400" />
                      {s}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No strengths recorded.</li>
                )}
              </ul>
            </MotionCard>
            <MotionCard delay={0.15}>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Weak Points
              </div>
              <ul className="mt-2 space-y-1.5">
                {weakPoints.length > 0 ? (
                  weakPoints.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="mt-1 h-1 w-1 rounded-full bg-amber-400" />
                      {w}
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-slate-500">No weak points recorded.</li>
                )}
              </ul>
            </MotionCard>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionCard delay={0.05}>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <Video className="h-3.5 w-3.5" /> Video Score
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#e5edff]">{videoScore}</p>
        </MotionCard>
        <MotionCard delay={0.1}>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Camera className="h-3.5 w-3.5" /> Camera Score
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#e5edff]">{cameraScore}</p>
        </MotionCard>
        <MotionCard delay={0.15}>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-400">
            <Mic2 className="h-3.5 w-3.5" /> Speech Score
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#e5edff]">{speechScore}</p>
        </MotionCard>
        <MotionCard delay={0.2}>
          <div className="flex items-center gap-2 text-xs font-semibold text-green-400">
            <Zap className="h-3.5 w-3.5" /> Answer Score
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[#e5edff]">{answerScore}</p>
        </MotionCard>
      </div>

      {/* Next Task */}
      {nextTask && (
        <MotionCard>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-blue-300">Next Practice Task</p>
              <p className="mt-1 text-xs text-slate-300">{nextTask}</p>
            </div>
          </div>
        </MotionCard>
      )}

      {/* Transcript Preview */}
      {transcriptPreview && (
        <MotionCard>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Mic2 className="h-3.5 w-3.5" /> Transcript Preview
          </div>
          <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-slate-700/20 bg-slate-900/40 p-4 text-xs leading-relaxed text-slate-300">
            {transcriptPreview}
          </div>
        </MotionCard>
      )}

      {/* Model Used */}
      <MotionCard>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Sparkles className="h-3.5 w-3.5" /> AI Model
        </div>
        <p className="mt-2 text-xs text-slate-300">{modelUsed}</p>
      </MotionCard>

      {/* AI Coach (secondary) */}
      <div className="pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-700/30" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            AI Coach (Text Analysis)
          </span>
          <div className="h-px flex-1 bg-slate-700/30" />
        </div>

        <MotionCard>
          <h3 className="text-sm font-semibold text-[#e5edff]">AI Coach</h3>
          {aiError && (
            <div className="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {aiError}
            </div>
          )}
          <textarea
            rows={5}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2.5 text-sm text-[#e5edff] outline-none focus:border-blue-500/40"
            placeholder="Paste your answer here..."
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40"
              placeholder="Interview question"
            />
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40"
              placeholder="Target role"
            />
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">
              Advanced settings
            </summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-[#e5edff] outline-none"
                placeholder="API Key"
              />
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-[#e5edff] outline-none"
                placeholder="Base URL"
              />
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-1.5 text-xs text-[#e5edff] outline-none"
                placeholder="Model"
              />
            </div>
          </details>
          <GradientButton onClick={handleAiCoach} disabled={aiLoading} className="mt-4">
            {aiLoading ? "Analyzing…" : "Run AI Coach"}
          </GradientButton>
        </MotionCard>

        {aiResult && (
          <div className="mt-4 space-y-5">
            <div className="grid gap-5 lg:grid-cols-3">
              <MotionCard className="flex flex-col items-center justify-center lg:col-span-1">
                <ScoreRing
                  score={(aiResult.answer_score as number) ?? 0}
                  size={140}
                  strokeWidth={10}
                  label="AI Coach"
                />
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle className="h-3 w-3" />
                  {(aiResult.answer_score as number) ?? 0 >= 80
                    ? "Excellent"
                    : (aiResult.answer_score as number) ?? 0 >= 60
                    ? "Good"
                    : "Needs Work"}
                </div>
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  {String(aiResult.summary ?? "")}
                </p>
              </MotionCard>

              <div className="space-y-4 lg:col-span-2">
                <MotionCard delay={0.05}>
                  <h4 className="text-xs font-semibold text-[#e5edff]">Dimension Breakdown</h4>
                  <div className="mt-3 space-y-3">
                    <ProgressBar
                      value={(aiResult.answer_score as number) ?? 0}
                      max={100}
                      color="#60a5fa"
                      label="AI Coach Score"
                    />
                    <ProgressBar value={85} max={100} color="#22d3ee" label="Structure" />
                    <ProgressBar value={72} max={100} color="#8b5cf6" label="Relevance" />
                    <ProgressBar value={90} max={100} color="#22c55e" label="Clarity" />
                  </div>
                </MotionCard>

                <div className="grid gap-4 sm:grid-cols-2">
                  <MotionCard delay={0.1}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle className="h-3.5 w-3.5" /> Strengths
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {((aiResult.content_strengths as string[]) ?? []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </MotionCard>
                  <MotionCard delay={0.15}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> Weak Points
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {((aiResult.content_weak_points as string[]) ?? []).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="mt-1 h-1 w-1 rounded-full bg-amber-400" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </MotionCard>
                </div>
              </div>
            </div>

            <MotionCard>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#e5edff]">AI Improved Response</h4>
                <div className="flex gap-1.5">
                  {["Impact-Driven", "Strong Verbs", "Quantifiable"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Original
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{transcript}</p>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    Enhanced by AI
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{improved}</p>
                </div>
              </div>
              <GradientButton variant="secondary" onClick={copyImproved} className="mt-3">
                {copied ? (
                  <CheckCircle className="mr-1.5 inline h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 inline h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy Improved Text"}
              </GradientButton>
            </MotionCard>

            <MotionCard>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-[#e5edff]">Live Pulse Analytics</h4>
              </div>
              <div className="mt-4 flex items-end gap-1.5">
                {[40, 65, 55, 80, 70, 90, 60, 75, 85, 50, 70, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500/40 to-cyan-400/40"
                    style={{ maxHeight: 80 }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                <span>0s</span>
                <span>10s</span>
                <span>20s</span>
                <span>30s</span>
                <span>40s</span>
                <span>50s</span>
                <span>60s</span>
              </div>
            </MotionCard>
          </div>
        )}
      </div>
    </div>
  );
}
