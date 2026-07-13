import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import { analyzeAnswer } from '../api/pitchpilotApi';
import { AnalyzeAnswerResponse } from '../types/pitchpilot';
import AppHeader from '../components/AppHeader';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import ScoreCircle from '../components/ScoreCircle';
import LoadingState from '../components/LoadingState';

interface FeedbackScreenProps {
  onBack: () => void;
  mode: string;
  question: string;
  role: string;
}

export default function FeedbackScreen({ onBack, mode, question, role }: FeedbackScreenProps) {
  const [transcript, setTranscript] = useState('');
  const [questionInput, setQuestionInput] = useState(question);
  const [roleInput, setRoleInput] = useState(role);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeAnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim()) {
      Alert.alert('Missing transcript', 'Please enter your answer transcript.');
      return;
    }
    if (!questionInput.trim()) {
      Alert.alert('Missing question', 'Please enter the interview question.');
      return;
    }
    if (!roleInput.trim()) {
      Alert.alert('Missing role', 'Please enter the target role.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzeAnswer({
        transcript: transcript.trim(),
        question: questionInput.trim(),
        role: roleInput.trim(),
        api_key: apiKey.trim() || undefined,
        base_url: baseUrl.trim() || undefined,
        model: model.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [transcript, questionInput, roleInput, apiKey, baseUrl, model]);

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <AppHeader title="AI Coach" showBack onBack={onBack} />
        <LoadingState message="Running AI Coach..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="AI Coach" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <Card variant="dark">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        {result ? (
          <>
            <View style={styles.resultHeader}>
              <ScoreCircle score={result.answer_score} size={110} label="Answer Score" />
              <Text style={styles.statusText}>
                Status: <Text style={styles.statusValue}>{result.status}</Text>
              </Text>
              <Text style={styles.modelText}>Model: {result.model_used}</Text>
            </View>

            <Text style={styles.sectionTitle}>Summary</Text>
            <Card>
              <Text style={styles.bodyText}>{result.summary}</Text>
            </Card>

            <Text style={styles.sectionTitle}>Strengths</Text>
            {result.content_strengths.map((s, i) => (
              <Card key={`strength-${i}`}>
                <Text style={styles.bulletText}>✅ {s}</Text>
              </Card>
            ))}

            <Text style={styles.sectionTitle}>Weak Points</Text>
            {result.content_weak_points.map((w, i) => (
              <Card key={`weak-${i}`}>
                <Text style={styles.bulletText}>⚠️ {w}</Text>
              </Card>
            ))}

            <Text style={styles.sectionTitle}>Improved Answer</Text>
            <Card>
              <Text style={styles.bodyText}>{result.improved_answer}</Text>
            </Card>

            <Text style={styles.sectionTitle}>Structure Feedback</Text>
            <Card>
              <Text style={styles.bodyText}>{result.structure_feedback}</Text>
            </Card>

            <Text style={styles.sectionTitle}>Next Task</Text>
            <Card>
              <Text style={styles.bodyText}>{result.next_content_task}</Text>
            </Card>

            <View style={styles.actions}>
              <PrimaryButton title="Analyze Another Answer" variant="secondary" onPress={() => setResult(null)} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Answer</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Type or paste your transcript here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={transcript}
              onChangeText={setTranscript}
            />

            <Text style={styles.sectionTitle}>Question</Text>
            <TextInput
              style={styles.input}
              placeholder="Interview question"
              placeholderTextColor={colors.textMuted}
              value={questionInput}
              onChangeText={setQuestionInput}
            />

            <Text style={styles.sectionTitle}>Target Role</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Software Developer"
              placeholderTextColor={colors.textMuted}
              value={roleInput}
              onChangeText={setRoleInput}
            />

            <Text style={styles.sectionTitle}>Optional Provider Settings</Text>
            <TextInput
              style={styles.input}
              placeholder="API Key (optional)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={apiKey}
              onChangeText={setApiKey}
            />
            <TextInput
              style={styles.input}
              placeholder="Base URL (optional)"
              placeholderTextColor={colors.textMuted}
              value={baseUrl}
              onChangeText={setBaseUrl}
            />
            <TextInput
              style={styles.input}
              placeholder="Model name (optional)"
              placeholderTextColor={colors.textMuted}
              value={model}
              onChangeText={setModel}
            />

            <View style={styles.actions}>
              <PrimaryButton title="Run AI Coach" onPress={handleAnalyze} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
    marginBottom: spacing.md,
  },
  textarea: {
    minHeight: 120,
    lineHeight: 22,
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  resultHeader: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  statusText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statusValue: {
    color: colors.success,
    fontWeight: '700',
  },
  modelText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.background,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: fontSize.md,
    color: colors.background,
    lineHeight: 22,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
