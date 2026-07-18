import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { loadLastAnalysis } from '../api/pitchpilotApi';
import { exportHtmlReport, exportCsvReport } from '../api/pitchpilotApi';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import ScoreRing from '../components/ScoreRing';
import StatusBadge from '../components/StatusBadge';
import SectionTitle from '../components/SectionTitle';
import LoadingOverlay from '../components/LoadingOverlay';

async function shareContent(filename: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const path = (cacheDirectory || '') + filename;
  await writeAsStringAsync(path, content, { encoding: 'utf8' });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType, dialogTitle: `Share ${filename}` });
  } else {
    Alert.alert('Sharing unavailable', 'File saved to cache. Please share manually.');
  }
}

export default function FeedbackScreen() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'html' | 'csv' | null>(null);

  useEffect(() => {
    let mounted = true;
    loadLastAnalysis().then((data) => {
      if (mounted) {
        setAnalysis(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const final = analysis?.final_feedback || {};
  const ai = analysis?.ai_result || {};
  const speech = analysis?.speech_result || {};
  const sessionId = analysis?.session_id ?? null;
  const saveWarning = analysis?.save_warning ?? null;

  const overallScore = (final.overall_score as number) || 0;
  const performanceLevel = String(final.performance_level || '—');
  const strengths = (final.strengths as string[]) || [];
  const weakPoints = (final.weak_points as string[]) || [];
  const nextTask = String(final.next_practice_task || '');
  const summary = String(ai.summary || final.summary || '');
  const modelUsed = String(ai.model_used || '');
  const improvedAnswer = String(ai.improved_answer || '');

  const handleExportHtml = useCallback(async () => {
    if (!sessionId) return;
    setExporting('html');
    try {
      const data = await exportHtmlReport(sessionId);
      await shareContent(data.filename, data.content, 'text/html');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(null);
    }
  }, [sessionId]);

  const handleExportCsv = useCallback(async () => {
    if (!sessionId) return;
    setExporting('csv');
    try {
      const data = await exportCsvReport(sessionId);
      await shareContent(data.filename, data.content, 'text/csv');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(null);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingOverlay message="Loading feedback..." />
      </SafeAreaView>
    );
  }

  if (!analysis) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No feedback yet</Text>
          <Text style={styles.emptyText}>
            Run a practice session first to see your AI coaching feedback here.
          </Text>
          <GradientButton
            title="Start Practice"
            onPress={() => router.push('/practice')}
            style={{ marginTop: spacing.xl }}
            icon={<Ionicons name="play" size={18} color="#fff" />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {exporting && (
        <LoadingOverlay message={exporting === 'html' ? 'Exporting HTML...' : 'Exporting CSV...'} />
      )}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>

        {/* Score Ring */}
        <View style={styles.scoreSection}>
          <ScoreRing score={overallScore} size={180} strokeWidth={14} />
          <View style={styles.badgesRow}>
            <StatusBadge
              text={performanceLevel}
              variant={overallScore >= 80 ? 'success' : overallScore >= 60 ? 'warning' : 'danger'}
            />
            {sessionId ? (
              <StatusBadge text="Saved to History" variant="success" />
            ) : saveWarning ? (
              <StatusBadge text="Not Saved" variant="warning" />
            ) : null}
          </View>
        </View>

        {/* Coach Card */}
        <SectionTitle title="Coach Feedback" />
        <GlassCard>
          <View style={styles.coachHeader}>
            <View style={styles.coachAvatar}>
              <Ionicons name="person-circle" size={40} color={colors.cyan} />
            </View>
            <View style={styles.coachMeta}>
              <Text style={styles.coachName}>Coach Aria</Text>
              {modelUsed ? (
                <Text style={styles.coachModel}>Model: {modelUsed}</Text>
              ) : null}
            </View>
          </View>
          {summary ? (
            <Text style={styles.coachSummary}>{summary}</Text>
          ) : (
            <Text style={styles.coachSummary}>No summary available.</Text>
          )}
        </GlassCard>

        {/* Dimension Scores */}
        <SectionTitle title="Dimension Scores" />
        <View style={styles.scoreGrid}>
          <DimensionCard
            label="Video"
            score={Math.round((final.video_score as number) || 0)}
            color={colors.blue}
            icon="videocam"
          />
          <DimensionCard
            label="Camera"
            score={Math.round((final.camera_score as number) || 0)}
            color={colors.cyan}
            icon="camera"
          />
          <DimensionCard
            label="Speech"
            score={Math.round((final.speech_score as number) || 0)}
            color={colors.purple}
            icon="mic"
          />
          <DimensionCard
            label="Answer"
            score={Math.round((final.answer_score as number) || 0)}
            color={colors.success}
            icon="document-text"
          />
        </View>

        {/* Strengths */}
        {strengths.length > 0 && (
          <>
            <SectionTitle title="Key Strengths" />
            <GlassCard>
              {strengths.map((s, i) => (
                <View key={`s-${i}`} style={styles.listItem}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.listText}>{s}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* Growth Areas */}
        {weakPoints.length > 0 && (
          <>
            <SectionTitle title="Growth Areas" />
            <GlassCard>
              {weakPoints.map((w, i) => (
                <View key={`w-${i}`} style={styles.listItem}>
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text style={styles.listText}>{w}</Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        {/* Improved Answer */}
        {improvedAnswer ? (
          <>
            <SectionTitle title="Improved Answer" />
            <GlassCard>
              <Text style={styles.improvedText}>{improvedAnswer}</Text>
            </GlassCard>
          </>
        ) : (
          <>
            <SectionTitle title="Answer Improvement" />
            <GlassCard>
              <Text style={styles.improvedText}>
                No improved answer generated. Focus on structuring your response with clear examples and quantifiable results.
              </Text>
            </GlassCard>
          </>
        )}

        {/* Next Task */}
        {nextTask ? (
          <>
            <SectionTitle title="Next Milestone" />
            <GlassCard>
              <View style={styles.listItem}>
                <Ionicons name="flag" size={18} color={colors.warning} />
                <Text style={styles.listText}>{nextTask}</Text>
              </View>
            </GlassCard>
          </>
        ) : null}

        {/* Transcript Preview */}
        {speech.transcript ? (
          <>
            <SectionTitle title="Transcript Preview" />
            <GlassCard>
              <Text style={styles.transcript}>{String(speech.transcript)}</Text>
            </GlassCard>
          </>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          <GradientButton
            title="Run Another Practice"
            onPress={() => router.push('/practice')}
            icon={<Ionicons name="refresh" size={18} color="#fff" />}
          />
          <View style={styles.actionSpacer} />
          <GradientButton
            title="View History"
            variant="secondary"
            onPress={() => router.push('/history' as any)}
            icon={<Ionicons name="time-outline" size={18} color={colors.textPrimary} />}
          />
          <View style={styles.actionSpacer} />
          <GradientButton
            title="View Dashboard"
            variant="secondary"
            onPress={() => router.push('/dashboard' as any)}
            icon={<Ionicons name="stats-chart" size={18} color={colors.textPrimary} />}
          />
          {sessionId ? (
            <>
              <View style={styles.actionSpacer} />
              <View style={styles.exportRow}>
                <GradientButton
                  title={exporting === 'html' ? 'Exporting...' : 'Export HTML'}
                  variant="outline"
                  onPress={handleExportHtml}
                  disabled={exporting === 'html'}
                  style={{ flex: 1 }}
                  icon={<Ionicons name="document-text-outline" size={16} color={colors.blue} />}
                />
                <View style={{ width: spacing.md }} />
                <GradientButton
                  title={exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                  variant="outline"
                  onPress={handleExportCsv}
                  disabled={exporting === 'csv'}
                  style={{ flex: 1 }}
                  icon={<Ionicons name="download-outline" size={16} color={colors.blue} />}
                />
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DimensionCard({
  label,
  score,
  color,
  icon,
}: {
  label: string;
  score: number;
  color: string;
  icon: string;
}) {
  return (
    <GlassCard style={styles.dimCard} noBorder>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.dimScore, { color }]}>{score}</Text>
      <Text style={styles.dimLabel}>{label}</Text>
    </GlassCard>
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  scoreSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachMeta: {
    flex: 1,
  },
  coachName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  coachModel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  coachSummary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dimCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  dimScore: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  dimLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: 6,
  },
  listText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  improvedText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  transcript: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xl,
  },
  actionSpacer: {
    height: spacing.md,
  },
  exportRow: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(168,179,207,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
