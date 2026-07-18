import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, TrendingUp, Calendar, Target, RotateCcw, RefreshCw } from "lucide-react";
import MotionCard from "../components/MotionCard";
import MetricCard from "../components/MetricCard";
import ProgressBar from "../components/ProgressBar";
import SkeletonCard from "../components/SkeletonCard";
import EmptyState from "../components/EmptyState";
import { ErrorState } from "../components/EmptyState";
import GradientButton from "../components/GradientButton";
import { pitchpilotApi } from "../api/pitchpilotApi";
import type { DashboardStats, SessionSummary } from "../types/pitchpilot";

const SKILL_COLORS = ["#60a5fa", "#22d3ee", "#8b5cf6", "#22c55e"];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pitchpilotApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData =
    stats?.recent_sessions
      ?.slice()
      .reverse()
      .map((s: SessionSummary, idx: number) => ({
        session: `S${idx + 1}`,
        score: Math.round(s.overall_score || 0),
      })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">Track your interview coaching progress over time.</p>
          </div>
          <SkeletonCard />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">Track your interview coaching progress over time.</p>
          </div>
        </div>
        <ErrorState
          title="Backend unavailable"
          message={error}
          action={
            <GradientButton onClick={fetchStats}>
              <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" /> Retry
            </GradientButton>
          }
        />
      </div>
    );
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Analytics Dashboard</h1>
            <p className="text-xs text-slate-400">Track your interview coaching progress over time.</p>
          </div>
          <GradientButton variant="secondary" onClick={fetchStats}>
            <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" /> Refresh
          </GradientButton>
        </div>
        <EmptyState
          title="No practice sessions yet."
          message="Complete a practice session to see your dashboard stats and progress."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Analytics Dashboard</h1>
          <p className="text-xs text-slate-400">Track your interview coaching progress over time.</p>
        </div>
        <GradientButton variant="secondary" onClick={fetchStats}>
          <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" /> Refresh
        </GradientButton>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Sessions"
          value={stats.total_sessions}
          icon={<Calendar className="h-4 w-4" />}
          color="blue"
          delay={0}
        />
        <MetricCard
          title="Average Score"
          value={stats.average_score}
          subtitle="/ 100"
          icon={<TrendingUp className="h-4 w-4" />}
          color="cyan"
          delay={0.05}
        />
        <MetricCard
          title="Best Score"
          value={stats.best_score}
          subtitle="/ 100"
          icon={<Trophy className="h-4 w-4" />}
          color="purple"
          delay={0.1}
        />
        <MetricCard
          title="Latest Score"
          value={stats.latest_score}
          subtitle="/ 100"
          icon={<Target className="h-4 w-4" />}
          color="green"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <MotionCard className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#e5edff]">Score Progression</h3>
          <div className="mt-4 h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="session" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#111a2e",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: 12,
                      color: "#e5edff",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={SKILL_COLORS[i % SKILL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Not enough data for a chart
              </div>
            )}
          </div>
        </MotionCard>

        <MotionCard delay={0.1}>
          <h3 className="text-sm font-semibold text-[#e5edff]">Skill Breakdown</h3>
          <div className="mt-4 space-y-4">
            <ProgressBar value={Math.round(stats.average_video_score)} max={100} color="#60a5fa" label="Video / Body Language" />
            <ProgressBar value={Math.round(stats.average_camera_score)} max={100} color="#22d3ee" label="Eye Contact / Camera" />
            <ProgressBar value={Math.round(stats.average_speech_score)} max={100} color="#8b5cf6" label="Speech Clarity" />
            <ProgressBar value={Math.round(stats.average_answer_score)} max={100} color="#22c55e" label="Content Quality" />
          </div>
        </MotionCard>
      </div>

      {/* Recent Activity */}
      <MotionCard delay={0.2}>
        <h3 className="text-sm font-semibold text-[#e5edff]">Recent Activity</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/30 text-slate-500">
                <th className="pb-2 font-medium">Session</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2 font-medium">Level</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {stats.recent_sessions.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="border-b border-slate-700/10"
                >
                  <td className="py-3 font-medium text-[#e5edff]">
                    {r.interview_question || `Session #${r.id}`}
                  </td>
                  <td className="py-3">{formatDate(r.created_at)}</td>
                  <td className="py-3">{r.target_role || "—"}</td>
                  <td className="py-3 font-semibold text-blue-300">
                    {Math.round(r.overall_score || 0)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.performance_level === "Excellent"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : r.performance_level === "Good"
                          ? "bg-blue-500/10 text-blue-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {r.performance_level || "—"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </MotionCard>
    </div>
  );
}
