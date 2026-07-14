import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shuffle,
  Lightbulb,
  Activity,
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
  FileCheck,
} from "lucide-react";
import { pitchpilotApi } from "../api/pitchpilotApi";
import { useToast } from "../components/Toast";
import MotionCard from "../components/MotionCard";
import GradientButton from "../components/GradientButton";
import UploadDropzone from "../components/UploadDropzone";
import AnalysisProgress, { type AnalysisStep } from "../components/AnalysisProgress";

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveState(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

const PROGRESS_DELAYS: Record<AnalysisStep, number> = {
  uploading: 0,
  video: 800,
  camera: 1800,
  speech: 2800,
  ai: 3800,
  final: 4800,
  done: 0,
};

export default function PracticePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>(loadState("pp_mode", ""));
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>(loadState("pp_question", ""));
  const [role, setRole] = useState<string>(loadState("pp_role", ""));
  const [loadingModes, setLoadingModes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState<AnalysisStep>("uploading");

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    pitchpilotApi
      .getPracticeModes()
      .then((res) => {
        setModes(res.modes);
        const initial = loadState("pp_mode", res.modes[0] ?? "");
        setSelectedMode(initial);
        setLoadingModes(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load modes");
        setLoadingModes(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedMode) return;
    setLoadingQuestions(true);
    setError("");
    Promise.all([
      pitchpilotApi.getQuestionsForMode(selectedMode),
      pitchpilotApi.getDefaultRole(selectedMode),
    ])
      .then(([qRes, rRes]) => {
        setQuestions(qRes.questions);
        const saved = loadState("pp_question", "");
        setSelectedQuestion(saved && qRes.questions.includes(saved) ? saved : (qRes.questions[0] ?? ""));
        setRole(loadState("pp_role", "") || rRes.role);
        setLoadingQuestions(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed");
        setLoadingQuestions(false);
      });
  }, [selectedMode]);

  useEffect(() => {
    saveState("pp_mode", selectedMode);
  }, [selectedMode]);
  useEffect(() => {
    saveState("pp_question", selectedQuestion);
  }, [selectedQuestion]);
  useEffect(() => {
    saveState("pp_role", role);
  }, [role]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  async function handleRandom() {
    if (!selectedMode) return;
    setLoadingQuestions(true);
    try {
      const res = await pitchpilotApi.getRandomQuestion(selectedMode);
      setSelectedQuestion(res.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Random failed");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function startProgressSimulation() {
    clearTimers();
    setProgressStep("uploading");
    const steps: AnalysisStep[] = ["video", "camera", "speech", "ai", "final"];
    steps.forEach((step) => {
      const id = window.setTimeout(() => {
        setProgressStep(step);
      }, PROGRESS_DELAYS[step]);
      timersRef.current.push(id);
    });
  }

  function stopProgressSimulation() {
    clearTimers();
    setProgressStep("done");
  }

  async function runFullAnalysis() {
    if (!file) {
      setError("Select an MP4 file first.");
      return;
    }
    setError("");
    setIsAnalyzing(true);
    startProgressSimulation();

    try {
      const res = await pitchpilotApi.analyzeFull(file, {
        question: selectedQuestion,
        role,
      });

      stopProgressSimulation();

      // Store result for Feedback page
      const payload = {
        result: res,
        meta: {
          fileName: file.name,
          question: selectedQuestion,
          role,
          mode: selectedMode,
          analyzedAt: new Date().toISOString(),
          sessionId: (res.session_id as number | undefined) ?? null,
        },
      };
      localStorage.setItem("pp_last_analysis", JSON.stringify(payload));

      showToast("Full analysis complete!", "success");
      navigate("/feedback");
    } catch (e) {
      clearTimers();
      setIsAnalyzing(false);
      const msg = e instanceof Error ? e.message : "Analysis failed";
      setError(msg);
      showToast(msg, "error");
    }
  }

  const hasLastAnalysis = !!localStorage.getItem("pp_last_analysis");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Practice Lab</h1>
          <p className="text-xs text-slate-400">
            Configure your session, upload a video, and run analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-300">Pipeline Ready</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left config */}
        <div className="space-y-4 lg:col-span-1">
          <MotionCard>
            <label className="block text-xs font-medium text-slate-400">Practice Mode</label>
            {loadingModes ? (
              <div className="mt-2 h-9 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                disabled={isAnalyzing}
                className="mt-2 w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 disabled:opacity-50"
              >
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </MotionCard>

          <MotionCard delay={0.05}>
            <label className="block text-xs font-medium text-slate-400">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isAnalyzing}
              placeholder="e.g. Software Developer"
              className="mt-2 w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 placeholder:text-slate-600 disabled:opacity-50"
            />
          </MotionCard>

          <MotionCard delay={0.1}>
            <label className="block text-xs font-medium text-slate-400">Interview Question</label>
            {loadingQuestions ? (
              <div className="mt-2 h-9 animate-pulse rounded-lg bg-slate-800" />
            ) : (
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                disabled={isAnalyzing}
                className="mt-2 w-full rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40 disabled:opacity-50"
              >
                {questions.map((q, i) => (
                  <option key={i} value={q}>
                    {q.length > 60 ? q.slice(0, 60) + "…" : q}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleRandom}
              disabled={loadingQuestions || isAnalyzing}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-700/40 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-700/60 transition disabled:opacity-50"
            >
              <Shuffle className="h-3 w-3" /> Random Question
            </button>
          </MotionCard>

          <MotionCard delay={0.15}>
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-amber-300">Pro Tip</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Use good lighting and keep your face centered for the best camera presence score.
                </p>
              </div>
            </div>
          </MotionCard>

          {hasLastAnalysis && (
            <MotionCard delay={0.2}>
              <div className="flex items-start gap-2">
                <FileCheck className="mt-0.5 h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs font-medium text-blue-300">Last Analysis Ready</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    You have a completed analysis. View it on the Feedback page.
                  </p>
                  <GradientButton
                    variant="secondary"
                    onClick={() => navigate("/feedback")}
                    className="mt-2 w-full text-[11px] py-1.5"
                  >
                    View Feedback
                  </GradientButton>
                </div>
              </div>
            </MotionCard>
          )}
        </div>

        {/* Right main */}
        <div className="space-y-5 lg:col-span-2">
          <MotionCard>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Play className="h-3.5 w-3.5 text-blue-400" />
              Video Upload
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Upload your recorded practice session. We accept MP4 files up to 200 MB.
            </p>
            <div className="mt-3">
              <UploadDropzone
                onFileSelect={setFile}
                file={file}
                onError={(msg) => {
                  setError(msg);
                  showToast(msg, "error");
                }}
              />
            </div>
          </MotionCard>

          {isAnalyzing && (
            <MotionCard>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#e5edff]">Running Full Analysis</span>
                <span className="text-[11px] text-slate-500">Please wait…</span>
              </div>
              <AnalysisProgress step={progressStep} />
            </MotionCard>
          )}

          {!isAnalyzing && (
            <MotionCard delay={0.1}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <GradientButton
                  onClick={runFullAnalysis}
                  disabled={!file || isAnalyzing}
                  className="flex-1"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                  Run Full Analysis
                </GradientButton>
                {error && (
                  <GradientButton
                    variant="secondary"
                    onClick={() => {
                      setError("");
                      setFile(null);
                    }}
                  >
                    <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" />
                    Reset
                  </GradientButton>
                )}
              </div>
              {!file && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Select a video file to enable analysis.
                </p>
              )}
            </MotionCard>
          )}
        </div>
      </div>
    </div>
  );
}
