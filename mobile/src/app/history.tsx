import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import {
  getSessions,
  getSessionDetail,
  deleteSession,
  exportHtmlReport,
  exportCsvReport,
} from '../api/pitchpilotApi';
import { SessionSummary, SessionDetail } from '../types/pitchpilot';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';

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

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.blue;
  return colors.warning;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'html' | 'csv' | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions().finally(() => setRefreshing(false));
  }, [fetchSessions]);

  const openDetail = useCallback(async (sessionId: number) => {
    setDetailLoading(true);
    try {
      const data = await getSessionDetail(sessionId);
      setDetail(data.session);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load detail.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleDelete = useCallback((sessionId: number) => {
    Alert.alert(
      'Delete Session',
      'This session will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
              setDetail(null);
              await fetchSessions();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed.');
            }
          },
        },
      ]
    );
  }, [fetchSessions]);

  const handleExportHtml = useCallback(async (sessionId: number) => {
    setExporting('html');
    try {
      const data = await exportHtmlReport(sessionId);
      await shareContent(data.filename, data.content, 'text/html');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(null);
    }
  }, []);

  const handleExportCsv = useCallback(async (sessionId: number) => {
    setExporting('csv');
    try {
      const data = await exportCsvReport(sessionId);
      await shareContent(data.filename, data.content, 'text/csv');
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(null);
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingOverlay message="Loading sessions..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {exporting && (
        <LoadingOverlay message={exporting === 'html' ? 'Exporting HTML...' : 'Exporting CSV...'} />
      )}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your practice sessions</Text>
        </View>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {sessions.length === 0 ? (
          <GlassCard>
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="time-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No sessions yet</Text>
              <Text style={styles.emptyText}>
                Complete a practice session to see your history here.
              </Text>
              <GradientButton
                title="Start Practice"
                onPress={() => router.push('/practice')}
                style={{ marginTop: spacing.lg }}
              />
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Session List */}
            {!detail && sessions.map((s) => (
              <TouchableOpacity
                key={s.id}
                activeOpacity={0.85}
                onPress={() => openDetail(s.id)}
              >
                <GlassCard>
                  <View style={styles.sessionRow}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName} numberOfLines={1}>
                        {s.interview_question || `Session #${s.id}`}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {formatDateShort(s.created_at)} · {s.target_role || 'No role'}
                      </Text>
                    </View>
                    <View style={styles.sessionScoreCol}>
                      <Text style={[styles.sessionScore, { color: getScoreColor(Math.round(s.overall_score || 0)) }]}>
                        {Math.round(s.overall_score || 0)}
                      </Text>
                      <Text style={styles.sessionLevel}>{s.performance_level}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}

            {/* Detail View */}
            {detail && (
              <>
                <TouchableOpacity onPress={() => setDetail(null)} style={styles.backRow} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={18} color={colors.blue} />
                  <Text style={styles.backText}>Back to list</Text>
                </TouchableOpacity>

                {detailLoading ? (
                  <LoadingOverlay message="Loading detail..." />
                ) : (
                  <>
                    <GlassCard>
                      <Text style={styles.detailName}>
                        {detail.interview_question || `Session #${detail.id}`}
                      </Text>
                      <Text style={styles.detailMeta}>{formatDateShort(detail.created_at)}</Text>
                      {detail.target_role ? (
                        <Text style={styles.detailMeta}>Role: {detail.target_role}</Text>
                      ) : null}
                      <View style={styles.detailScoreRow}>
                        <Text style={styles.detailScore}>{Math.round(detail.overall_score || 0)}</Text>
                        <Text style={styles.detailScoreLabel}>Overall</Text>
                      </View>
                    </GlassCard>

                    <Text style={styles.sectionLabel}>Scores</Text>
                    <GlassCard>
                      <ScoreRow label="Video" value={detail.video_score} color={colors.blue} />
                      <ScoreRow label="Camera" value={detail.camera_score} color={colors.cyan} />
                      <ScoreRow label="Speech" value={detail.speech_score} color={colors.purple} />
                      <ScoreRow label="Answer" value={detail.answer_score} color={colors.success} />
                    </GlassCard>

                    {detail.transcript ? (
                      <>
                        <Text style={styles.sectionLabel}>Transcript</Text>
                        <GlassCard>
                          <Text style={styles.transcript}>{detail.transcript}</Text>
                        </GlassCard>
                      </>
                    ) : null}

                    {detail.strengths && detail.strengths.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>Strengths</Text>
                        <GlassCard>
                          {detail.strengths.map((s, i) => (
                            <View key={i} style={styles.listItem}>
                              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                              <Text style={styles.listText}>{s}</Text>
                            </View>
                          ))}
                        </GlassCard>
                      </>
                    )}

                    {detail.weak_points && detail.weak_points.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>Growth Areas</Text>
                        <GlassCard>
                          {detail.weak_points.map((w, i) => (
                            <View key={i} style={styles.listItem}>
                              <Ionicons name="alert-circle" size={16} color={colors.danger} />
                              <Text style={styles.listText}>{w}</Text>
                            </View>
                          ))}
                        </GlassCard>
                      </>
                    )}

                    {detail.next_practice_task ? (
                      <>
                        <Text style={styles.sectionLabel}>Next Milestone</Text>
                        <GlassCard>
                          <View style={styles.listItem}>
                            <Ionicons name="flag" size={16} color={colors.warning} />
                            <Text style={styles.listText}>{detail.next_practice_task}</Text>
                          </View>
                        </GlassCard>
                      </>
                    ) : null}

                    <View style={styles.actions}>
                      <GradientButton
                        title={exporting === 'html' ? 'Exporting...' : 'Export HTML'}
                        variant="secondary"
                        onPress={() => handleExportHtml(detail.id)}
                        disabled={exporting === 'html'}
                      />
                      <View style={styles.actionSpacer} />
                      <GradientButton
                        title={exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
                        variant="secondary"
                        onPress={() => handleExportCsv(detail.id)}
                        disabled={exporting === 'csv'}
                      />
                      <View style={styles.actionSpacer} />
                      <GradientButton
                        title="Delete Session"
                        variant="outline"
                        onPress={() => handleDelete(detail.id)}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreRowHeader}>
        <Text style={styles.scoreRowLabel}>{label}</Text>
        <Text style={[styles.scoreRowValue, { color }]}>{Math.round(pct)}</Text>
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
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
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168,179,207,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  sessionRow: {
    flexDirection: 'row',
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
    marginRight: spacing.sm,
  },
  sessionScore: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  sessionLevel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  backText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.blue,
  },
  detailName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  detailScoreRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  detailScore: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.cyan,
  },
  detailScoreLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
  scoreRow: {
    marginVertical: spacing.sm,
  },
  scoreRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scoreRowLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scoreRowValue: {
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginVertical: 4,
  },
  listText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  transcript: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionSpacer: {
    height: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
