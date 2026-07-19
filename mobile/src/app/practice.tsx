import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import {
  getPracticeModes,
  getQuestionsForMode,
  getRandomQuestion,
  getDefaultRole,
  analyzeFullVideo,
  saveLastAnalysis,
  getSaveHistorySetting,
} from '../api/pitchpilotApi';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorBanner from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';

const PROGRESS_STEPS = [
  'Uploading',
  'Video Analysis',
  'Camera Analysis',
  'Speech Analysis',
  'AI Feedback',
  'Final Score',
];

const PRACTICE_TABS = ['Solo Practice', 'AI Interview'] as const;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; question?: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof PRACTICE_TABS[number]>('Solo Practice');
  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [role, setRole] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loadingModes, setLoadingModes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveHistory, setSaveHistory] = useState(true);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingModes(true);
    getSaveHistorySetting().then((v) => {
      if (mounted) setSaveHistory(v);
    });
    getPracticeModes()
      .then((res) => {
        if (!mounted) return;
        // Filter out modes whose ids contain a '/' — those break the
        // GET /api/v1/questions/{mode} path on the backend (e.g. "AI/ML
        // Interview"). Keep the rest so the page is still usable.
        const safeModes = (res.modes ?? []).filter((m) => !m.includes('/'));
        setModes(safeModes);
        if (safeModes.length > 0) {
          handleSelectMode(safeModes[0]);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load practice modes.');
      })
      .finally(() => {
        if (mounted) setLoadingModes(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Prefill the question when arriving from the coaching plan's
  // "Start Recommended Practice" button. Mode selection stays manual since
  // the recommended mode label may not match a backend-provided mode id.
  useEffect(() => {
    const q = typeof params.question === 'string' ? params.question.trim() : '';
    if (q) {
      setQuestionInput(q);
    }
  }, [params.question]);

  const handleSelectMode = useCallback(async (mode: string) => {
    setSelectedMode(mode);
    setLoadingQuestions(true);
    try {
      const [qRes, rRes] = await Promise.all([
        getQuestionsForMode(mode),
        getDefaultRole(mode),
      ]);
      setQuestions(qRes.questions);
      setRole(rRes.role);
      if (qRes.questions.length > 0) {
        setQuestionInput(qRes.questions[0]);
      }
    } catch {
      setError('Failed to load questions.');
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  const handleRandomQuestion = useCallback(async () => {    if (!selectedMode) return;
    setLoadingQuestions(true);
    try {
      const res = await getRandomQuestion(selectedMode);
      setQuestionInput(res.question);
    } catch {
      setError('Failed to get random question.');
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedMode]);

  const handlePickVideo = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      const ext = asset.name?.toLowerCase() || '';
      if (!ext.endsWith('.mp4') && !ext.endsWith('.mov')) {
        Alert.alert('Invalid file', 'Only MP4 or MOV files are supported.');
        return;
      }
      setFile(asset);
      setError(null);
    } catch {
      Alert.alert('Error', 'Could not pick a file.');
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login required',
        'Please log in to save your practice history.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Login',
            onPress: () =>
              router.push({ pathname: '/login', params: { next: '/practice' } } as any),
          },
        ]
      );
      return;
    }
    if (!file) {
      Alert.alert('Missing video', 'Please select a video first.');
      return;
    }
    if (!questionInput.trim()) {
      Alert.alert('Missing question', 'Please select or enter a question.');
      return;
    }

    setAnalyzing(true);
    setProgressIndex(0);
    setError(null);

    progressTimer.current = setInterval(() => {
      setProgressIndex((prev) => {
        if (prev >= PROGRESS_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2500);

    try {
      const mime = file.mimeType || 'video/mp4';
      const nameLower = (file.name || '').toLowerCase();
      const looksLikeVideo =
        mime.startsWith('video/') ||
        nameLower.endsWith('.mp4') ||
        nameLower.endsWith('.mov');
      if (!looksLikeVideo) {
        throw new Error('Please select a valid MP4 or MOV video.');
      }

      const asset = {
        uri: file.uri,
        name: file.name,
        mimeType: mime,
        size: file.size ?? null,
        // Expo web populates DocumentPickerAsset.file with a real browser File.
        file: (file as unknown as { file?: File }).file ?? null,
      };

      const data = await analyzeFullVideo(asset, {
        question: questionInput.trim(),
        role: role.trim() || 'General',
        save_session: saveHistory,
      });

      const payload = {
        ...data,
        meta: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.mimeType,
          question: questionInput.trim(),
          role: role.trim(),
          mode: selectedMode,
          analyzedAt: new Date().toISOString(),
        },
      };
      await saveLastAnalysis(payload);

      if (progressTimer.current) clearInterval(progressTimer.current);
      setAnalyzing(false);
      setProgressIndex(0);
      router.push('/feedback' as any);
    } catch (err) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setAnalyzing(false);
      setProgressIndex(0);
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    }
  }, [file, questionInput, role, selectedMode, router, isAuthenticated, saveHistory]);

  const handleReset = useCallback(() => {
    setFile(null);
    setError(null);
    setProgressIndex(0);
  }, []);

  if (analyzing) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingOverlay
          message="Running Full Analysis..."
          steps={PROGRESS_STEPS}
          currentStep={progressIndex}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice Lab</Text>
          <Text style={styles.headerSubtitle}>Refine your pitch with AI feedback.</Text>
        </View>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {!isAuthenticated && (
          <GlassCard style={styles.authNotice}>
            <View style={styles.authNoticeRow}>
              <Ionicons name="lock-closed" size={18} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={styles.authNoticeTitle}>Login required</Text>
                <Text style={styles.authNoticeText}>
                  Please log in to save your practice history.
                </Text>
              </View>
            </View>
            <GradientButton
              title="Go to Login"
              onPress={() =>
                router.push({ pathname: '/login', params: { next: '/practice' } } as any)
              }
              style={{ marginTop: spacing.md }}
              icon={<Ionicons name="log-in-outline" size={18} color="#fff" />}
            />
          </GlassCard>
        )}

        {/* Segmented Control */}
        <View style={styles.segmentContainer}>
          {PRACTICE_TABS.map((tab) => {
            const isAiInterview = tab === 'AI Interview';
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={isAiInterview ? 1 : 0.85}
                onPress={() => {
                  if (isAiInterview) {
                    Alert.alert('Coming Soon', 'AI Interview mode will be added in a future version.');
                    return;
                  }
                  setActiveTab(tab);
                }}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive, isAiInterview && styles.segmentBtnDisabled]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text
                    style={[
                      styles.segmentText,
                      isActive && styles.segmentTextActive,
                      isAiInterview && styles.segmentTextDisabled,
                    ]}
                  >
                    {tab}
                  </Text>
                  {isAiInterview && (
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>Soon</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Target Role */}
        <Text style={styles.label}>Target Role</Text>
        <TextInput
          style={styles.input}
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Software Developer"
          placeholderTextColor={colors.textMuted}
        />

        {/* Mode Selector */}
        <Text style={styles.label}>Practice Mode</Text>
        {loadingModes ? (
          <Text style={styles.loadingText}>Loading modes...</Text>
        ) : (
          <View style={styles.modesRow}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => handleSelectMode(mode)}
                style={[styles.modeChip, selectedMode === mode && styles.modeChipActive]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    selectedMode === mode && styles.modeChipTextActive,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Question */}
        <Text style={styles.label}>Interview Question</Text>
        {loadingQuestions ? (
          <Text style={styles.loadingText}>Loading questions...</Text>
        ) : (
          <>
            <GlassCard>
              <Text style={styles.questionText}>{questionInput}</Text>
            </GlassCard>
            <TouchableOpacity style={styles.randomBtn} onPress={handleRandomQuestion} activeOpacity={0.7}>
              <Ionicons name="shuffle" size={16} color={colors.blue} />
              <Text style={styles.randomBtnText}>Random Question</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Upload Card */}
        <Text style={styles.label}>Upload Session</Text>
        <TouchableOpacity
          style={[styles.uploadCard, file && styles.uploadCardActive]}
          onPress={handlePickVideo}
          activeOpacity={0.85}
        >
          <View style={styles.uploadIconCircle}>
            <Ionicons name="videocam" size={28} color={colors.cyan} />
          </View>
          <Text style={styles.uploadTitle}>
            {file ? 'Change Video' : 'Upload Session'}
          </Text>
          <Text style={styles.uploadHint}>
            {file ? 'Tap to select a different file' : 'Tap to select a video file'}
          </Text>
          <View style={styles.uploadNotes}>
            <Text style={styles.uploadNote}>MP4 / MOV</Text>
            <Text style={styles.uploadDot}>·</Text>
            <Text style={styles.uploadNote}>Max 200 MB</Text>
          </View>
        </TouchableOpacity>

        {file && (
          <GlassCard style={styles.fileCard}>
            <Ionicons name="film-outline" size={20} color={colors.blue} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.fileMeta}>
                {file.size ? formatBytes(file.size) : ''}
                {file.mimeType ? ` · ${file.mimeType}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={handleReset} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Analyze Button */}
        <GradientButton
          title="Run Analysis"
          onPress={handleAnalyze}
          disabled={!file || !questionInput.trim()}
          style={{ marginTop: spacing.lg }}
          icon={<Ionicons name="sparkles" size={18} color="#fff" />}
        />

        {/* AI Tip */}
        <GlassCard style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={16} color={colors.warning} />
            <Text style={styles.tipTitle}>AI Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Use good lighting and keep your face centered for the best camera presence score.
          </Text>
        </GlassCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  authNotice: {
    marginBottom: spacing.md,
  },
  authNoticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  authNoticeTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  authNoticeText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.blue,
  },
  segmentBtnDisabled: {
    opacity: 0.6,
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  segmentTextDisabled: {
    color: colors.textMuted,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(155,124,255,0.15)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.purple,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modeChipActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  questionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 22,
  },
  randomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    gap: 4,
  },
  randomBtnText: {
    color: colors.blue,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  uploadCardActive: {
    borderColor: colors.cyan,
    borderStyle: 'solid',
    backgroundColor: 'rgba(53,215,255,0.04)',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uploadHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  uploadNotes: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  uploadNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  uploadDot: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  fileMeta: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  tipCard: {
    marginTop: spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.warning,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
