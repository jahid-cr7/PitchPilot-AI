import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Trophy, TrendingUp, ListChecks, Plus, CheckCircle2,
  Trash2, RotateCcw, Lightbulb, Zap, BookOpen, Sparkles
} from 'lucide-react';
import MotionCard from '../components/MotionCard';
import GradientButton from '../components/GradientButton';
import EmptyState, { ErrorState } from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import { pitchpilotApi } from '../api/pitchpilotApi';
import { useNavigate } from 'react-router-dom';
import type { CoachingPlan, UserGoal } from '../types/pitchpilot';

export default function CoachingPlanPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<CoachingPlan | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('0');
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [planData, goalsData] = await Promise.all([
        pitchpilotApi.getCoachingPlan(),
        pitchpilotApi.getGoals(),
      ]);
      setPlan(planData);
      setGoals(goalsData.goals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coaching data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  async function handleCreateGoal() {
    if (!newTitle.trim() || !newMetric.trim() || !newTarget.trim()) return;
    setSaving(true);
    try {
      await pitchpilotApi.createGoal({
        title: newTitle.trim(),
        target_metric: newMetric.trim(),
        target_value: Number(newTarget),
        current_value: Number(newCurrent),
      });
      setNewTitle('');
      setNewMetric('');
      setNewTarget('');
      setNewCurrent('0');
      setShowCreateForm(false);
      const goalsData = await pitchpilotApi.getGoals();
      setGoals(goalsData.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteGoal(goal: UserGoal) {
    try {
      await pitchpilotApi.updateGoal(goal.id, {
        status: 'completed',
        current_value: goal.target_value,
      });
      const goalsData = await pitchpilotApi.getGoals();
      setGoals(goalsData.goals || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteGoal(goalId: number) {
    try {
      await pitchpilotApi.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error(err);
    }
  }

  function handleStartPractice() {
    const mode = plan?.recommended_practice_mode;
    if (mode) {
      navigate(`/practice?mode=${encodeURIComponent(mode)}`);
    } else {
      navigate('/practice');
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Coaching Plan</h1>
            <p className="text-xs text-slate-400">Your personalized improvement roadmap.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Coaching Plan</h1>
            <p className="text-xs text-slate-400">Your personalized improvement roadmap.</p>
          </div>
        </div>
        <ErrorState
          title="Failed to load coaching data"
          message={error}
          action={
            <GradientButton onClick={fetchData}>
              <RotateCcw className="w-4 h-4" />
              Retry
            </GradientButton>
          }
        />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e5edff]">Coaching Plan</h1>
            <p className="text-xs text-slate-400">Your personalized improvement roadmap.</p>
          </div>
        </div>
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No coaching data yet."
          message="Complete a practice session to generate your personalized coaching plan."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e5edff]">Coaching Plan</h1>
          <p className="text-xs text-slate-400">Your personalized improvement roadmap.</p>
        </div>
        <GradientButton onClick={handleStartPractice}>
          <Sparkles className="w-4 h-4" />
          Start Recommended Practice
        </GradientButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MotionCard className="p-6" delay={0.05}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Focus Area</h3>
          </div>
          <p className="text-lg font-medium text-[#e5edff] mb-3">{plan.focus_area}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Level: {plan.current_level}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>{plan.weekly_goal}</span>
          </div>
        </MotionCard>
<MotionCard className="p-6" delay={0.1}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Weekly Goal</h3>
          </div>
          <p className="text-sm text-slate-300 mb-3">{plan.weekly_goal}</p>
        </MotionCard>

        <MotionCard className="p-6" delay={0.15}>
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Action Steps</h3>
          </div>
          <ul className="space-y-2">
            {plan.action_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </MotionCard>

        <MotionCard className="p-6" delay={0.2}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Next Milestone</h3>
          </div>
          <p className="text-sm text-slate-300 mb-3">{plan.next_milestone}</p>
          {plan.metrics_to_watch && plan.metrics_to_watch.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Metrics to watch:</p>
              <div className="flex flex-wrap gap-2">
                {plan.metrics_to_watch.map((m, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </MotionCard>

        <MotionCard className="p-6" delay={0.25}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-[#e5edff]">Recommended Practice</h3>
          </div>
          {plan.recommended_practice_mode ? (
            <>
              <p className="text-sm font-medium text-[#e5edff] mb-1">
                {plan.recommended_practice_mode}
              </p>
              {plan.recommended_question && (
                <p className="text-xs text-slate-400 italic">
                  &ldquo;{plan.recommended_question}&rdquo;
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">No recommendation yet.</p>
          )}
        </MotionCard>

        {plan.ai_note && (
          <MotionCard className="p-6" delay={0.3}>
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#e5edff]">Coaching Note</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                    AI
                  </span>
                </div>
                <p className="text-sm text-slate-300">{plan.ai_note}</p>
              </div>
            </div>
          </MotionCard>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#e5edff]">Your Goals</h2>
          <GradientButton onClick={() => setShowCreateForm((v) => !v)}>
            <Plus className="w-4 h-4" />
            New Goal
          </GradientButton>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input
                data-testid="coaching-goal-title"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-[#e5edff] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="e.g. Improve pitch clarity"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Metric</label>
              <input
                data-testid="coaching-goal-metric"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-[#e5edff] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="e.g. Clarity Score"
                value={newMetric}
                onChange={(e) => setNewMetric(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Value</label>
                <input
                  data-testid="coaching-goal-target"
                  type="number"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-[#e5edff] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                  placeholder="100"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Current Value</label>
                <input
                  type="number"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-[#e5edff] placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                  placeholder="0"
                  value={newCurrent}
                  onChange={(e) => setNewCurrent(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <GradientButton onClick={handleCreateGoal} disabled={saving} data-testid="coaching-goal-save">
                {saving ? 'Saving...' : 'Save Goal'}
              </GradientButton>
              <button
                className="px-3 py-2 text-sm text-slate-400 hover:text-[#e5edff] transition-colors"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {activeGoals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-[#e5edff]">{goal.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Active</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{goal.target_metric}</span>
                    <span>{goal.current_value} / {goal.target_value}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (goal.current_value / goal.target_value) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-slate-400 hover:text-emerald-400 transition-colors"
                    onClick={() => handleCompleteGoal(goal)}
                    title="Mark complete"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    onClick={() => handleDeleteGoal(goal.id)}
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {completedGoals.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">Completed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/30 border border-emerald-500/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-[#e5edff]">{goal.title}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Achieved: {goal.current_value} / {goal.target_value}</span>
                  </div>
                  {goal.completed_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      Completed: {new Date(goal.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}