import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import {
  getSessions,
  getSessionDetail,
  deleteSession,
  exportHtmlReport,
  exportCsvReport,
} from '../api/pitchpilotApi';
import { SessionSummary, SessionDetail } from '../types/pitchpilot';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingState from '../components/LoadingState';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
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
  if (score >= 60) return colors.primaryLight;
  return colors.warning;
}

type ViewMode = 'list' | 'detail' | 'report';

export default function HistoryScreen() {
  const [view, setView] = useState<ViewMode>('list');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportFilename, setReportFilename] = useState<string>('');
  const [reportType, setReportType] = useState<'html' | 'csv' | null>(null);

  useEffect(() => {
    let mounted = true;
    getSessions()
      .then((data) => {
        if (mounted) setSessions(data.sessions || []);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load sessions.');
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
    getSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sessions.'))
      .finally(() => setRefreshing(false));
  }, []);

  const openDetail = useCallback(async (sessionId: number) => {
    setDetailLoading(true);
    setView('detail');
    try {
      const data = await getSessionDetail(sessionId);
      setDetail(data.session);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load detail.');
      setView('list');
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
              setView('list');
              setDetail(null);
              const data = await getSessions();
              setSessions(data.sessions || []);
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed.');
            }
          },
        },
      ]
    );
  }, []);

  const handleExportHtml = useCallback(async (sessionId: number) => {
    try {
      const data = await exportHtmlReport(sessionId);
      setReportContent(data.content);
      setReportFilename(data.filename);
      setReportType('html');
      setView('report');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Export failed.');
    }
  }, []);

  const handleExportCsv = useCallback(async (sessionId: number) => {
    try {
      const data = await exportCsvReport(sessionId);
      setReportContent(data.content);
      setReportFilename(data.filename);
      setReportType('csv');
      setView('report');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Export failed.');
    }
  }, []);

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your practice sessions</Text>
        </View>
        <LoadingState message="Loading sessions..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your practice sessions</Text>
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

  if (sessions.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>Your practice sessions</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          <Card variant="dark">
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Your practice sessions will appear here once you complete your first recording.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Report Preview View
  if (view === 'report') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setView('detail')} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {reportFilename}
          </Text>
          <View style={styles.backBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Card variant="dark">
            <Text style={styles.reportTypeLabel}>
              {reportType?.toUpperCase()} Report Preview
            </Text>
          </Card>
          <Card variant="dark">
            <Text style={styles.reportContent}>{reportContent}</Text>
          </Card>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Detail View
  if (view === 'detail') {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setView('list')} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>
            Session Detail
          </Text>
          <View style={styles.backBtn} />
        </View>

        {detailLoading || !detail ? (
          <LoadingState message="Loading session detail..." />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <Card variant="dark">
              <Text style={styles.detailSessionName}>
                {detail.interview_question || `Session #${detail.id}`}
              </Text>
              <Text style={styles.detailMeta}>{formatDate(detail.created_at)}</Text>
              {detail.target_role ? (
                <Text style={styles.detailMeta}>Role: {detail.target_role}</Text>
              ) : null}
              <View style={styles.detailScoreRow}>
                <Text style={styles.detailScore}>{Math.round(detail.overall_score || 0)}</Text>
                <Text style={styles.detailScoreLabel}>Overall</Text>
              </View>
            </Card>

            {/* Scores */}
            <Text style={styles.sectionTitle}>Scores</Text>
            <Card>
              <ScoreRow label="Video" value={detail.video_score} />
              <ScoreRow label="Camera" value={detail.camera_score} />
              <ScoreRow label="Speech" value={detail.speech_score} />
              <ScoreRow label="Answer" value={detail.answer_score} />
            </Card>

            {/* Transcript */}
            {detail.transcript ? (
              <>
                <Text style={styles.sectionTitle}>Transcript</Text>
                <Card variant="dark">
                  <Text style={styles.detailBody}>{detail.transcript}</Text>
                </Card>
              </>
            ) : null}

            {/* Strengths */}
            {detail.strengths && detail.strengths.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Strengths</Text>
                {detail.strengths.map((s, i) => (
                  <Card key={`strength-${i}`}>
                    <Text style={styles.bulletText}>✅ {s}</Text>
                  </Card>
                ))}
              </>
            ) : null}

            {/* Weak Points */}
            {detail.weak_points && detail.weak_points.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Weak Points</Text>
                {detail.weak_points.map((w, i) => (
                  <Card key={`weak-${i}`}>
                    <Text style={styles.bulletText}>⚠️ {w}</Text>
                  </Card>
                ))}
              </>
            ) : null}

            {/* Summary */}
            {detail.summary ? (
              <>
                <Text style={styles.sectionTitle}>Summary</Text>
                <Card variant="dark">
                  <Text style={styles.detailBody}>{detail.summary}</Text>
                </Card>
              </>
            ) : null}

            {/* Next Task */}
            {detail.next_practice_task ? (
              <>
                <Text style={styles.sectionTitle}>Next Practice Task</Text>
                <Card variant="dark">
                  <Text style={styles.detailBody}>{detail.next_practice_task}</Text>
                </Card>
              </>
            ) : null}

            {/* Metadata */}
            <Text style={styles.sectionTitle}>Metadata</Text>
            <Card variant="dark">
              {detail.duration_seconds > 0 ? (
                <MetaRow label="Duration" value={`${Math.round(detail.duration_seconds)}s`} />
              ) : null}
              {detail.word_count > 0 ? (
                <MetaRow label="Words" value={`${detail.word_count}`} />
              ) : null}
              {detail.words_per_minute > 0 ? (
                <MetaRow label="WPM" value={`${Math.round(detail.words_per_minute)}`} />
              ) : null}
              {detail.filler_word_count > 0 ? (
                <MetaRow label="Fillers" value={`${detail.filler_word_count}`} />
              ) : null}
              {detail.repeated_word_count > 0 ? (
                <MetaRow label="Repeats" value={`${detail.repeated_word_count}`} />
              ) : null}
              {detail.framing ? <MetaRow label="Framing" value={detail.framing} /> : null}
              {detail.fps > 0 ? <MetaRow label="FPS" value={`${Math.round(detail.fps)}`} /> : null}
              {detail.resolution ? <MetaRow label="Resolution" value={detail.resolution} /> : null}
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
              <PrimaryButton
                title="Export HTML"
                variant="secondary"
                onPress={() => handleExportHtml(detail.id)}
              />
              <View style={styles.actionSpacer} />
              <PrimaryButton
                title="Export CSV"
                variant="secondary"
                onPress={() => handleExportCsv(detail.id)}
              />
              <View style={styles.actionSpacer} />
              <PrimaryButton
                title="Delete Session"
                variant="outline"
                onPress={() => handleDelete(detail.id)}
              />
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // List View
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>Your practice sessions</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {sessions.map((s: SessionSummary) => (
          <TouchableOpacity key={s.id} onPress={() => openDetail(s.id)} activeOpacity={0.8}>
            <Card variant="dark">
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
                  <Text
                    style={[
                      styles.sessionScore,
                      { color: getScoreColor(Math.round(s.overall_score || 0)) },
                    ]}
                  >
                    {Math.round(s.overall_score || 0)}
                  </Text>
                  <Text style={styles.sessionLevel}>{s.performance_level}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreRowHeader}>
        <Text style={styles.scoreRowLabel}>{label}</Text>
        <Text style={styles.scoreRowValue}>{Math.round(pct)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${pct}%`,
              backgroundColor: getScoreColor(pct),
            },
          ]}
        />
      </View>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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
  },
  sessionLevel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 60,
  },
  backText: {
    color: colors.primaryLight,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  detailSessionName: {
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
    marginTop: spacing.md,
  },
  detailScore: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  detailScoreLabel: {
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
    color: colors.background,
    fontWeight: '600',
  },
  scoreRowValue: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.background,
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
  detailBody: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: fontSize.sm,
    color: colors.background,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  metaLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionSpacer: {
    height: spacing.md,
  },
  reportTypeLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.primaryLight,
    textAlign: 'center',
  },
  reportContent: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
