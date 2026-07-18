import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { getDashboardStats } from '../api/pitchpilotApi';
import { DashboardStats, SessionSummary } from '../types/pitchpilot';
import GlassCard from '../components/GlassCard';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function getLevelColor(level: string): string {
  if (level === 'Excellent') return colors.success;
  if (level === 'Good') return colors.blue;
  return colors.warning;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getDashboardStats()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getDashboardStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingOverlay message="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {!stats || stats.total_sessions === 0 ? (
          <GlassCard>
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>
                Complete a practice session to see your stats and progress.
              </Text>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <KpiCard label="Sessions" value={stats.total_sessions} color={colors.blue} />
              <KpiCard label="Avg Score" value={Math.round(stats.average_score || 0)} color={colors.cyan} />
              <KpiCard label="Best" value={Math.round(stats.best_score || 0)} color={colors.purple} />
              <KpiCard label="Latest" value={Math.round(stats.latest_score || 0)} color={colors.success} />
            </View>

            {/* Skill Breakdown */}
            <Text style={styles.sectionLabel}>Skill Breakdown</Text>
            <GlassCard>
              <SkillRow label="Video / Body" value={stats.average_video_score} color={colors.blue} />
              <SkillRow label="Camera" value={stats.average_camera_score} color={colors.cyan} />
              <SkillRow label="Speech" value={stats.average_speech_score} color={colors.purple} />
              <SkillRow label="Answer" value={stats.average_answer_score} color={colors.success} />
            </GlassCard>

            {/* Recent Sessions */}
            <Text style={styles.sectionLabel}>Recent Sessions</Text>
            {stats.recent_sessions.length === 0 ? (
              <GlassCard>
                <Text style={styles.emptyText}>No recent sessions.</Text>
              </GlassCard>
            ) : (
              stats.recent_sessions.map((s: SessionSummary) => (
                <GlassCard key={s.id}>
                  <View style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {s.interview_question || `Session #${s.id}`}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {formatDate(s.created_at)} · {s.target_role || 'No role'}
                      </Text>
                    </View>
                    <View style={styles.sessionScoreCol}>
                      <Text style={[styles.sessionScore, { color: getLevelColor(s.performance_level) }]}>
                        {Math.round(s.overall_score || 0)}
                      </Text>
                      <Text style={[styles.sessionLevel, { color: getLevelColor(s.performance_level) }]}>
                        {s.performance_level}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard style={styles.kpiCard} noBorder>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </GlassCard>
  );
}

function SkillRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <View style={styles.skillRow}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillLabel}>{label}</Text>
        <Text style={[styles.skillValue, { color }]}>{Math.round(pct)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  kpiCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  kpiValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillRow: {
    marginVertical: spacing.sm,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  skillLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  skillValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  sessionName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sessionMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sessionScoreCol: {
    alignItems: 'flex-end',
  },
  sessionScore: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  sessionLevel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 1,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
