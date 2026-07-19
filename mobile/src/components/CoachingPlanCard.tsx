/**
 * CoachingPlanCard
 * ================
 * Reusable card that surfaces the logged-in user's personalized coaching plan
 * (GET /api/v1/users/me/coaching-plan) inside the mobile app.
 *
 * Handles four states without ever crashing the host screen:
 *   - logged out  -> login prompt
 *   - loading     -> spinner
 *   - error       -> friendly "unavailable" message
 *   - success     -> the coaching plan (the backend's beginner baseline plan
 *                    naturally reads as an empty / no-sessions state)
 *
 * Uses the shared premium components (GlassCard, GradientButton, StatusBadge)
 * and theme tokens so it matches the dark UI everywhere it is dropped in.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { getCoachingPlan } from '../api/pitchpilotApi';
import { CoachingPlan } from '../types/pitchpilot';
import { useAuth } from '../context/AuthContext';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import StatusBadge from './StatusBadge';

interface CoachingPlanCardProps {
  /** Render a condensed version (used on the Settings/Account area). */
  compact?: boolean;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon as any} size={16} color={colors.cyan} />
      </View>
      <View style={styles.detailTextCol}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function CoachingPlanCard({ compact = false }: CoachingPlanCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<CoachingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(false);
    try {
      const data = await getCoachingPlan();
      setPlan(data);
    } catch {
      // 401s are handled globally by the API client; any failure here just
      // shows a friendly message and never crashes the host screen.
      setError(true);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlan();
    } else {
      setPlan(null);
      setError(false);
      setLoading(false);
    }
  }, [isAuthenticated, fetchPlan]);

  const goToPractice = useCallback(() => {
    if (plan && (plan.recommended_practice_mode || plan.recommended_question)) {
      router.push({
        pathname: '/practice',
        params: {
          mode: plan.recommended_practice_mode || '',
          question: plan.recommended_question || '',
        },
      } as any);
    } else {
      router.push('/practice' as any);
    }
  }, [plan, router]);

  // --- Logged out ---------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <GlassCard>
        <View style={styles.headerRow}>
          <Ionicons name="compass-outline" size={18} color={colors.cyan} />
          <Text style={styles.headerTitle}>Your Coaching Plan</Text>
        </View>
        <Text style={styles.mutedText}>
          Log in to unlock your personalized coaching plan.
        </Text>
        <GradientButton
          title="Login"
          onPress={() => router.push('/login' as any)}
          style={{ marginTop: spacing.md }}
          icon={<Ionicons name="log-in-outline" size={18} color="#fff" />}
        />
      </GlassCard>
    );
  }

  // --- Loading ------------------------------------------------------------
  if (loading) {
    return (
      <GlassCard>
        <View style={styles.headerRow}>
          <Ionicons name="compass-outline" size={18} color={colors.cyan} />
          <Text style={styles.headerTitle}>Your Coaching Plan</Text>
        </View>
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.cyan} />
          <Text style={styles.mutedText}>Building your plan...</Text>
        </View>
      </GlassCard>
    );
  }

  // --- Error --------------------------------------------------------------
  if (error || !plan) {
    return (
      <GlassCard>
        <View style={styles.headerRow}>
          <Ionicons name="compass-outline" size={18} color={colors.cyan} />
          <Text style={styles.headerTitle}>Your Coaching Plan</Text>
        </View>
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
          <Text style={styles.mutedText}>Coaching plan is unavailable right now.</Text>
        </View>
      </GlassCard>
    );
  }

  // --- Success ------------------------------------------------------------
  return (
    <GlassCard>
      <View style={styles.headerRow}>
        <Ionicons name="compass" size={18} color={colors.cyan} />
        <Text style={styles.headerTitle}>Your Coaching Plan</Text>
        {plan.current_level ? (
          <View style={styles.levelBadge}>
            <StatusBadge text={plan.current_level} variant="info" />
          </View>
        ) : null}
      </View>

      <Text style={styles.focusLabel}>FOCUS AREA</Text>
      <Text style={styles.focusValue}>{plan.focus_area}</Text>

      {plan.weekly_goal ? (
        <View style={styles.goalBox}>
          <Ionicons name="flag-outline" size={16} color={colors.blue} />
          <Text style={styles.goalText}>{plan.weekly_goal}</Text>
        </View>
      ) : null}

      {!compact && (
        <View style={styles.detailsWrap}>
          <DetailRow icon="trophy-outline" label="Next Milestone" value={plan.next_milestone} />
          <DetailRow
            icon="school-outline"
            label="Recommended Practice Mode"
            value={plan.recommended_practice_mode}
          />
          <DetailRow
            icon="chatbubble-ellipses-outline"
            label="Recommended Question"
            value={plan.recommended_question}
          />
        </View>
      )}

      <GradientButton
        title="Start Recommended Practice"
        onPress={goToPractice}
        style={{ marginTop: spacing.lg }}
        icon={<Ionicons name="play" size={18} color="#fff" />}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  levelBadge: {
    marginLeft: 'auto',
  },
  mutedText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  focusLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  focusValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(79,140,255,0.06)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  goalText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailsWrap: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginTop: 1,
    lineHeight: 20,
  },
});
