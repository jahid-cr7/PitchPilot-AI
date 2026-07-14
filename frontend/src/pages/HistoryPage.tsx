import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Trash2,
  Filter,
  FileText,
  ChevronRight,
  Clock,
  BarChart3,
  RotateCcw,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import MotionCard from "../components/MotionCard";
import GradientButton from "../components/GradientButton";
import ProgressBar from "../components/ProgressBar";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";
import { ErrorState } from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import { pitchpilotApi } from "../api/pitchpilotApi";
import type { SessionSummary, SessionDetail } from "../types/pitchpilot";

const TABS = ["Today", "This Week", "All Time"];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  return "text-amber-400";
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

export default function HistoryPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("All Time");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selected, setSelected] = useState<SessionSummary | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pitchpilotApi.getSessions();
      // Sort newest first
      const sorted = (data.sessions || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(sorted);
      if (sorted.length > 0) {
        setSelected(sorted[0]);
      } else {
        setSelected(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(
    async (sessionId: number) => {
      setDetailLoading(true);
      try {
        const data = await pitchpilotApi.getSessionDetail(sessionId);
        setDetail(data.session);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to load session details.", "error");
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selected) {
      fetchDetail(selected.id);
    }
  }, [selected, fetchDetail]);

  const handleExportHtml = async (sessionId: number) => {
    try {
      const data = await pitchpilotApi.exportHtmlReport(sessionId);
      downloadFile(data.content, data.filename, "text/html");
      showToast("HTML report downloaded.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    }
  };

  const handleExportCsv = async (sessionId: number) => {
    try {
      const data = await pitchpilotApi.exportCsvReport(sessionId);
      downloadFile(data.content, data.filename, "text/csv");
      showToast("CSV report downloaded.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    }
  };

  const promptDelete = (sessionId: number) => {
    setDeletingId(sessionId);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId == null) return;
    setConfirmOpen(false);
    try {
      await pitchpilotApi.deleteSession(deletingId);
      showToast("Session deleted.", "success");
      await fetchSessions();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (tab === "All Time") return true;
    const d = new Date(s.created_at);
    const now = new Date();
    if (tab === "Today") {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (tab === "This Week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#e5edff]">Session History</h1>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#e5edff]">Session History</h1>
        </div>
        <ErrorState
          title="Backend unavailable"
          message={error}
          action={
            <GradientButton onClick={fetchSessions}>
              <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" /> Retry
            </GradientButton>
          }
        />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#e5edff]">Session History</h1>
          <GradientButton variant="secondary" onClick={fetchSessions}>
            <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" /> Refresh
          </GradientButton>
        </div>
        <EmptyState
          title="No sessions yet"
          message="Your practice sessions will appear here once you complete your first recording."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#e5edff]">Session History</h1>
        <div className="flex gap-2">
          <GradientButton variant="secondary" onClick={fetchSessions}>
            <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" /> Refresh
          </GradientButton>
          <GradientButton variant="secondary">
            <Filter className="mr-1.5 inline h-3.5 w-3.5" /> More Filters
          </GradientButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
              tab === t
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25"
                : "border border-slate-700/30 bg-slate-800/40 text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Session list */}
        <div className="space-y-3 lg:col-span-1">
          {filteredSessions.length === 0 && (
            <div className="rounded-xl border border-slate-700/20 bg-[#111a2e]/60 p-6 text-center text-xs text-slate-500">
              No sessions match this filter.
            </div>
          )}
          {filteredSessions.map((s) => (
            <motion.button
              key={s.id}
              onClick={() => setSelected(s)}
              whileHover={{ scale: 1.01 }}
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                selected?.id === s.id
                  ? "border-blue-500/30 bg-blue-500/10"
                  : "border-slate-700/20 bg-[#111a2e]/60 hover:bg-[#111a2e]"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#e5edff]">
                  {s.interview_question || `Session #${s.id}`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{formatDateShort(s.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-3">
                <span
                  className={`text-sm font-bold ${getScoreColor(
                    Math.round(s.overall_score || 0)
                  )}`}
                >
                  {Math.round(s.overall_score || 0)}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 lg:col-span-2"
            >
              {detailLoading || !detail ? (
                <SkeletonCard />
              ) : (
                <>
                  <MotionCard>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-[#e5edff]">
                          {detail.interview_question || `Session #${detail.id}`}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" /> {formatDate(detail.created_at)}
                        </p>
                        {detail.target_role && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            Role: {detail.target_role}
                          </p>
                        )}
                      </div>
                      <div className="text-3xl font-extrabold text-blue-400">
                        {Math.round(detail.overall_score || 0)}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Video Score
                        </p>
                        <div className="mt-2">
                          <ProgressBar
                            value={Math.round(detail.video_score || 0)}
                            max={100}
                            color="#60a5fa"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Camera Score
                        </p>
                        <div className="mt-2">
                          <ProgressBar
                            value={Math.round(detail.camera_score || 0)}
                            max={100}
                            color="#22d3ee"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Speech Score
                        </p>
                        <div className="mt-2">
                          <ProgressBar
                            value={Math.round(detail.speech_score || 0)}
                            max={100}
                            color="#8b5cf6"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Answer Score
                        </p>
                        <div className="mt-2">
                          <ProgressBar
                            value={Math.round(detail.answer_score || 0)}
                            max={100}
                            color="#22c55e"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transcript */}
                    {detail.transcript && (
                      <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Transcript
                        </p>
                        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-700/20 bg-slate-900/40 p-3 text-xs text-slate-300">
                          {detail.transcript}
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {detail.strengths && detail.strengths.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Strengths
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {detail.strengths.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-emerald-300">
                              <BarChart3 className="mt-0.5 h-3 w-3 text-emerald-400" /> {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weak Points */}
                    {detail.weak_points && detail.weak_points.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Weak Points
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {detail.weak_points.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-amber-300">
                              <AlertCircle className="mt-0.5 h-3 w-3 text-amber-400" /> {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    {detail.summary && (
                      <div className="mt-5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Summary
                        </p>
                        <p className="mt-2 text-xs text-slate-300">{detail.summary}</p>
                      </div>
                    )}

                    {/* Next Task */}
                    {detail.next_practice_task && (
                      <div className="mt-5 rounded-lg border border-blue-500/15 bg-blue-500/5 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                          Next Practice Task
                        </p>
                        <p className="mt-1 text-xs text-slate-300">{detail.next_practice_task}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:grid-cols-3">
                      {detail.duration_seconds > 0 && (
                        <div>Duration: {Math.round(detail.duration_seconds)}s</div>
                      )}
                      {detail.word_count > 0 && <div>Words: {detail.word_count}</div>}
                      {detail.words_per_minute > 0 && (
                        <div>WPM: {Math.round(detail.words_per_minute)}</div>
                      )}
                      {detail.filler_word_count > 0 && (
                        <div>Fillers: {detail.filler_word_count}</div>
                      )}
                      {detail.repeated_word_count > 0 && (
                        <div>Repeats: {detail.repeated_word_count}</div>
                      )}
                      {detail.framing && <div>Framing: {detail.framing}</div>}
                      {detail.fps > 0 && <div>FPS: {Math.round(detail.fps)}</div>}
                      {detail.resolution && <div>Resolution: {detail.resolution}</div>}
                    </div>
                  </MotionCard>

                  <div className="flex flex-wrap gap-2">
                    <GradientButton
                      variant="secondary"
                      onClick={() => handleExportHtml(detail.id)}
                    >
                      <FileText className="mr-1.5 inline h-3.5 w-3.5" /> Export HTML
                    </GradientButton>
                    <GradientButton
                      variant="secondary"
                      onClick={() => handleExportCsv(detail.id)}
                    >
                      <Download className="mr-1.5 inline h-3.5 w-3.5" /> Export CSV
                    </GradientButton>
                    <GradientButton
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => promptDelete(detail.id)}
                    >
                      <Trash2 className="mr-1.5 inline h-3.5 w-3.5" /> Delete
                    </GradientButton>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Session"
        message="This session and its reports will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
