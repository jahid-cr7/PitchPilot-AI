import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { getHealth, getBackendUrl } from '../api/pitchpilotApi';
import { getDashboardStats } from '../api/pitchpilotApi';
import { DashboardStats, SessionSummary } from '../types/pitchpilot';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import StatusBadge from '../components/StatusBadge';
import LoadingOverlay from '../components/LoadingOverlay';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestSession, setLatestSession] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await getHealth();
      setStatus('online');
    } catch {
      setStatus('offline');
    }

    try {
      const data = await getDashboardStats();
      setStats(data);
      if (data.recent_sessions && data.recent_sessions.length > 0) {
        setLatestSession(data.recent_sessions[0]);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {loading && <LoadingOverlay message="Loading..." />}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <View style={styles.logoCircle}>
              <Ionicons name="rocket" size={20} color={colors.cyan} />
            </View>
            <Text style={styles.topHeaderTitle}>PitchPilot AI</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Status Badge */}
        <View style={styles.statusRow}>
          <StatusBadge
            text={status === 'online' ? 'Backend Online' : status === 'offline' ? 'Backend Offline' : 'Checking...'}
            variant={status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'default'}
          />
          <Text style={styles.urlText}>{getBackendUrl()}</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badgePill}>
            <Text style={styles.badge}>READY FOR YOUR INTERVIEW?</Text>
          </View>
          <Text style={styles.heroTitle}>
            Practice smarter with{'\n'}AI-powered coaching.
          </Text>
          <Text style={styles.heroSubtitle}>
            Real-time feedback on your tone, pace, body language, and answer quality.
          </Text>
          <GradientButton
            title="Start Practice"
            onPress={() => router.push('/practice')}
            style={{ marginTop: spacing.xl }}
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </View>

        {/* Core Modules */}
        <Text style={styles.sectionTitle}>Core Modules</Text>
        <View style={styles.modulesGrid}>
          <ModuleCard
            icon="videocam"
            title="Video Analysis"
            desc="Motion, framing & presence scoring"
            color={colors.blue}
          />
          <ModuleCard
            icon="mic"
            title="AI Voice Coach"
            desc="Transcription, fillers & pace"
            color={colors.cyan}
          />
          <ModuleCard
            icon="analytics"
            title="Impact Analytics"
            desc="Overall score & coaching insights"
            color={colors.purple}
          />
        </View>

        {/* Last Session */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Session</Text>
          {stats && stats.total_sessions > 0 && (
            <TouchableOpacity onPress={() => router.push('/history')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {latestSession ? (
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/history')}>
            <GlassCard>
              <View style={styles.sessionRow}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {latestSession.interview_question || `Session #${latestSession.id}`}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {formatDate(latestSession.created_at)} · {latestSession.target_role || 'No role'}
                  </Text>
                </View>
                <View style={styles.sessionScoreCol}>
                  <Text style={styles.sessionScore}>{Math.round(latestSession.overall_score || 0)}</Text>
                  <Text style={styles.sessionLevel}>{latestSession.performance_level}</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard>
            <View style={styles.emptySession}>
              <Ionicons name="time-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptySessionText}>No sessions yet</Text>
              <Text style={styles.emptySessionSub}>
                Complete your first practice to see it here.
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Quick Stats */}
        {stats && stats.total_sessions > 0 && (
          <>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Sessions" value={stats.total_sessions} color={colors.blue} />
              <StatCard label="Avg Score" value={Math.round(stats.average_score || 0)} color={colors.cyan} />
              <StatCard label="Best" value={Math.round(stats.best_score || 0)} color={colors.purple} />
              <StatCard label="Latest" value={Math.round(stats.latest_score || 0)} color={colors.success} />
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ModuleCard({ icon, title, desc, color }: { icon: string; title: string; desc: string; color: string }) {
  return (
    <GlassCard style={styles.moduleCard}>
      <View style={[styles.moduleIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.moduleText}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleDesc}>{desc}</Text>
      </View>
    </GlassCard>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard style={styles.statCard} noBorder>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(53,215,255,0.15)',
  },
  topHeaderTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  urlText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  hero: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(53,215,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(53,215,255,0.15)',
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
  },
  badge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.cyan,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: fontSize.hero,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
    maxWidth: 320,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.blue,
  },
  modulesGrid: {
    gap: spacing.md,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moduleDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.cyan,
  },
  sessionLevel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  emptySession: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptySessionText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySessionSub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
