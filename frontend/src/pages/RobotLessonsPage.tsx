import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Trash2,
  Clock,
  Calendar,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import MotionCard from "../components/MotionCard";
import GradientButton from "../components/GradientButton";
import EmptyState from "../components/EmptyState";
import { pitchpilotApi } from "../api/pitchpilotApi";
import { useToast } from "../components/Toast";
import type { RobotLessonSummary } from "../types/pitchpilot";

export default function RobotLessonsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lessons, setLessons] = useState<RobotLessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLessons() {
    setLoading(true);
    setError("");
    try {
      const data = await pitchpilotApi.getRobotLessons();
      setLessons(data.lessons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLessons();
  }, []);

  async function handleDelete(id: number) {
    try {
      await pitchpilotApi.deleteRobotLesson(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
      showToast("Lesson deleted.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed.", "error");
    }
  }

  async function handleOpen(lesson: RobotLessonSummary) {
    try {
      const data = await pitchpilotApi.getRobotLesson(lesson.id);
      navigate("/robot-coach", {
        state: { lessonId: lesson.id, lesson: data.lesson },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to open lesson.", "error");
    }
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  }

  const focusLabels: Record<string, string> = {
    answer_structure: "Answer Structure",
    speech: "Speech",
    body_language: "Body Language",
    confidence: "Confidence",
    overall: "Overall",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Saved Robot Lessons</h1>
          <p className="text-xs text-slate-400">Replay your previous coach lessons.</p>
        </div>
        <GradientButton variant="secondary" onClick={() => navigate("/feedback")}>
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
          Back to Feedback
        </GradientButton>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MotionCard key={i}>
              <div className="h-4 w-1/2 rounded bg-slate-700/30" />
              <div className="mt-3 h-3 w-3/4 rounded bg-slate-700/30" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-700/30" />
            </MotionCard>
          ))}
        </div>
      )}

      {error && (
        <MotionCard>
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
          <GradientButton onClick={fetchLessons} className="mt-4">
            Retry
          </GradientButton>
        </MotionCard>
      )}

      {!loading && !error && lessons.length === 0 && (
        <EmptyState
          title="No saved lessons yet"
          message="Complete a practice session and generate a Robot Coach lesson to see it here."
          action={
            <GradientButton onClick={() => navigate("/practice")}>
              <Target className="mr-1.5 inline h-3.5 w-3.5" />
              Start Practice
            </GradientButton>
          }
        />
      )}

      {!loading && !error && lessons.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, i) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-slate-700/20 bg-gradient-to-br from-[#0d1b30] to-[#07111f] p-5 shadow-lg transition hover:border-slate-600/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <Bot className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#e5edff]">{lesson.title}</p>
                    <p className="text-[10px] text-slate-500">{lesson.coach_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Delete lesson"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                  <Sparkles className="h-3 w-3" />
                  {focusLabels[lesson.focus_area] || lesson.focus_area}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-700/30 bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  {lesson.estimated_duration_seconds}s
                </span>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">
                <Calendar className="h-3 w-3" />
                {formatDate(lesson.created_at)}
              </div>

              <div className="mt-4">
                <GradientButton
                  onClick={() => handleOpen(lesson)}
                  className="w-full"
                  variant="secondary"
                >
                  <BookOpen className="mr-1.5 inline h-3.5 w-3.5" />
                  Open Lesson
                </GradientButton>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
