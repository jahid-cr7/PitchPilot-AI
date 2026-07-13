import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import { getDashboardStats } from '../api/pitchpilotApi';
import { DashboardStats, SessionSummary } from '../types/pitchpilot';
import Card from '../components/Card';
import LoadingState from '../components/LoadingState';
import ScoreCircle from '../components/ScoreCircle';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function getLevelColor(level: string): string {
  if (level === 'Excellent') return colors.success;
  if (level === 'Good') return colors.primaryLight;
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
      .then((data) => setStats(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'))
      .finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>
        <LoadingState message="Loading dashboard..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Card variant="dark">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your progress</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Card variant="dark">
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Complete a practice session to see your stats and progress.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Track your progress</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <ScoreCircle score={Math.round(stats.average_score)} size={90} label="Avg Score" />
          </View>
          <View style={styles.kpiItem}>
            <ScoreCircle score={Math.round(stats.best_score)} size={90} label="Best Score" />
          </View>
          <View style={styles.kpiItem}>
            <ScoreCircle score={Math.round(stats.latest_score)} size={90} label="Latest" />
          </View>
        </View>

        <View style={styles.kpiCardsRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiValue}>{stats.total_sessions}</Text>
            <Text style={styles.kpiLabel}>Total Sessions</Text>
          </Card>
        </View>

        {/* Skill Breakdown */}
        <Text style={styles.sectionTitle}>Skill Breakdown</Text>
        <Card>
          <SkillRow label="Video / Body" value={stats.average_video_score} color={colors.primaryLight} />
          <SkillRow label="Camera" value={stats.average_camera_score} color={colors.info} />
          <SkillRow label="Speech" value={stats.average_speech_score} color={colors.warning} />
          <SkillRow label="Answer" value={stats.average_answer_score} color={colors.success} />
        </Card>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {stats.recent_sessions.length === 0 ? (
          <Card variant="dark">
            <Text style={styles.emptyText}>No recent sessions.</Text>
          </Card>
        ) : (
          stats.recent_sessions.map((s: SessionSummary) => (
            <Card key={s.id} variant="dark">
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
                  <Text style={styles.sessionScore}>{Math.round(s.overall_score || 0)}</Text>
                  <Text style={[styles.sessionLevel, { color: getLevelColor(s.performance_level) }]}>
                    {s.performance_level}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiCardsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  kpiLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
    color: colors.background,
    fontWeight: '600',
  },
  skillValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderDark,
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
    marginTop: spacing.xs,
  },
  sessionScoreCol: {
    alignItems: 'flex-end',
  },
  sessionScore: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  sessionLevel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
