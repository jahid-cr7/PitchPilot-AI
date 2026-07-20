import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Target,
  ListChecks,
  MessageSquare,
  Lightbulb,
  Sparkles,
  BookOpen,
  Compass,
  Bot,
  CheckCircle,
  Clock,
  Library,
} from "lucide-react";
import MotionCard from "../components/MotionCard";
import GradientButton from "../components/GradientButton";
import EmptyState from "../components/EmptyState";
import { pitchpilotApi } from "../api/pitchpilotApi";
import type { RobotLesson } from "../types/pitchpilot";

interface LocationState {
  sessionId?: number;
  lessonId?: number;
  lesson?: RobotLesson;
}

function useSpeechSynthesis() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);
  return available;
}

export default function RobotCoachPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const speechAvailable = useSpeechSynthesis();

  const { sessionId, lessonId: incomingLessonId, lesson: incomingLesson } =
    (location.state as LocationState | null) || {};

  const [lesson, setLesson] = useState<RobotLesson | null>(incomingLesson || null);
  const [lessonId, setLessonId] = useState<number | null>(incomingLessonId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSubIndex, setCurrentSubIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchLesson() {
    if (incomingLesson) {
      // Already have lesson data from navigation
      return;
    }
    if (incomingLessonId) {
      setLoading(true);
      setError("");
      try {
        const data = await pitchpilotApi.getRobotLesson(incomingLessonId);
        setLesson(data.lesson);
        setLessonId(incomingLessonId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const data = await pitchpilotApi.generateRobotLesson({
        session_id: sessionId,
        lesson_type: "interview",
        focus_area: "overall",
      });
      setLesson(data.lesson);
      setLessonId(data.lesson_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lesson.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLesson();
    return () => {
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, incomingLessonId]);

  function stopPlayback() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (utteranceRef.current && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    setIsPlaying(false);
    setCurrentSubIndex(0);
    setProgress(0);
  }

  function startPlayback() {
    if (!lesson) return;
    stopPlayback();
    setIsPlaying(true);

    const duration = lesson.estimated_duration_seconds || 60;
    const subs = lesson.subtitles;
    const subDuration = subs.length > 0 ? duration / subs.length : duration;

    // Speech synthesis
    if (speechAvailable && lesson.spoken_script) {
      const u = new SpeechSynthesisUtterance(lesson.spoken_script);
      u.rate = 1;
      u.pitch = 1.05;
      u.onend = () => {
        setIsPlaying(false);
        setProgress(100);
      };
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    }

    // Subtitle timer
    let idx = 0;
    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= subs.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        if (!speechAvailable) {
          setIsPlaying(false);
          setProgress(100);
        }
      }
      setCurrentSubIndex(idx);
    }, subDuration * 1000);

    // Progress bar timer (update every 200ms)
    const step = 100 / (duration * 5); // 5 updates per second
    let prog = 0;
    progressTimerRef.current = setInterval(() => {
      prog += step;
      if (prog >= 100) {
        prog = 100;
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProgress(prog);
    }, 200);
  }

  function handlePlayPause() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function handleReplay() {
    stopPlayback();
    setTimeout(() => startPlayback(), 100);
  }

  if (!sessionId && !incomingLessonId && !incomingLesson) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Robot Coach</h1>
          <p className="text-xs text-slate-400">AI-powered video-style lesson.</p>
        </div>
        <EmptyState
          title="Run a practice session first"
          message="Complete a practice session to generate a robot coach lesson tailored to your performance."
          action={
            <GradientButton onClick={() => navigate("/practice")}>
              <Target className="mr-1.5 inline h-3.5 w-3.5" />
              Start Practice
            </GradientButton>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500/20 border-t-blue-400"
        >
          <Bot className="h-8 w-8 text-blue-400" />
        </motion.div>
        <p className="text-sm text-slate-400">Coach Nova is preparing your lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Robot Coach</h1>
          <p className="text-xs text-slate-400">AI-powered video-style lesson.</p>
        </div>
        <MotionCard>
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
          <GradientButton onClick={fetchLesson} className="mt-4">
            <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" />
            Try Again
          </GradientButton>
        </MotionCard>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Robot Coach</h1>
          <p className="text-xs text-slate-400">AI-powered video-style lesson.</p>
        </div>
        <EmptyState title="Lesson unavailable" message="Could not generate a lesson for this session." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Robot Coach</h1>
            <p className="text-xs text-slate-400">AI-powered video-style lesson.</p>
          </div>
          {lessonId && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
              <CheckCircle className="h-3 w-3" />
              Saved Lesson
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <GradientButton variant="secondary" onClick={() => navigate("/robot-lessons")}>
            <Library className="mr-1.5 inline h-3.5 w-3.5" />
            View Saved Lessons
          </GradientButton>
          <GradientButton variant="secondary" onClick={() => navigate("/feedback")}>
            <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
            Back to Feedback
          </GradientButton>
        </div>
      </div>

      {/* Video-style player */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/20 bg-gradient-to-br from-[#0d1b30] to-[#07111f] p-6 md:p-10">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

        <div className="relative flex flex-col items-center gap-6">
          {/* Robot avatar */}
          <div className="relative">
            <motion.div
              animate={
                isPlaying
                  ? { scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }
                  : { scale: 1, opacity: 0.4 }
              }
              transition={
                isPlaying
                  ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
              className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl"
            />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
              <Bot className="h-12 w-12 text-white" />
            </div>
            {isPlaying && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-blue-400/40"
              />
            )}
          </div>

          {/* Coach name */}
          <div className="text-center">
            <p className="text-sm font-bold text-[#e5edff]">{lesson.coach_name}</p>
            <p className="text-[11px] text-slate-500">{lesson.title}</p>
          </div>

          {/* Subtitle area */}
          <div className="min-h-[3rem] w-full max-w-xl text-center">
            <AnimatePresence mode="wait">
              {lesson.subtitles.length > 0 && currentSubIndex < lesson.subtitles.length ? (
                <motion.p
                  key={currentSubIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-medium text-[#e5edff]"
                >
                  {lesson.subtitles[currentSubIndex].text}
                </motion.p>
              ) : (
                <p className="text-sm text-slate-500">
                  {isPlaying ? "..." : "Press play to start the lesson."}
                </p>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xl">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/40">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>{Math.round((progress / 100) * lesson.estimated_duration_seconds)}s</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lesson.estimated_duration_seconds}s
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              onClick={handleReplay}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700/40 bg-slate-800/60 text-slate-300 transition hover:text-white"
              aria-label="Replay"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {!speechAvailable && (
            <p className="text-[11px] text-slate-500">
              Text-to-speech is unavailable in this browser. Subtitles will still play.
            </p>
          )}
        </div>
      </div>

      {/* Lesson cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        <MotionCard delay={0.05}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">What Went Wrong</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{lesson.problem_summary}</p>
        </MotionCard>

        <MotionCard delay={0.1}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Why It Matters</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{lesson.why_it_matters}</p>
        </MotionCard>

        <MotionCard delay={0.15}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Correct Method</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{lesson.correct_method}</p>
        </MotionCard>

        <MotionCard delay={0.2}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Better Example</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{lesson.better_example}</p>
        </MotionCard>
      </div>

      {/* Practice steps */}
      <MotionCard delay={0.25}>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-[#e5edff]">Practice Steps</h3>
        </div>
        <div className="space-y-3">
          {lesson.practice_steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-slate-700/20 bg-slate-800/30 px-4 py-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-bold text-indigo-400">
                {i + 1}
              </span>
              <p className="text-xs text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </MotionCard>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <GradientButton onClick={() => navigate("/practice")}>
          <Target className="mr-1.5 inline h-3.5 w-3.5" />
          Practice Again
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => navigate("/feedback")}>
          <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
          Back to Feedback
        </GradientButton>
        <GradientButton variant="secondary" onClick={() => navigate("/coaching-plan")}>
          <Compass className="mr-1.5 inline h-3.5 w-3.5" />
          Open Coaching Plan
        </GradientButton>
      </div>
    </div>
  );
}
