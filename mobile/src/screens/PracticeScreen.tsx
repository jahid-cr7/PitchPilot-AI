import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import {
  getPracticeModes,
  getQuestionsForMode,
  getRandomQuestion,
  getDefaultRole,
} from '../api/pitchpilotApi';
import AppHeader from '../components/AppHeader';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import LoadingState from '../components/LoadingState';

interface PracticeScreenProps {
  onBack: () => void;
  onGoToFeedback: (mode: string, question: string, role: string) => void;
}

export default function PracticeScreen({ onBack, onGoToFeedback }: PracticeScreenProps) {
  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');
  const [loadingModes, setLoadingModes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPracticeModes()
      .then((res) => {
        setModes(res.modes);
        if (res.modes.length > 0) {
          handleSelectMode(res.modes[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingModes(false));
  }, []);

  const handleSelectMode = useCallback((mode: string) => {
    setSelectedMode(mode);
    setSelectedQuestion(null);
    setLoadingQuestions(true);
    setError(null);

    Promise.all([getQuestionsForMode(mode), getDefaultRole(mode)])
      .then(([qRes, rRes]) => {
        setQuestions(qRes.questions);
        setRole(rRes.role);
        if (qRes.questions.length > 0) {
          setSelectedQuestion(qRes.questions[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingQuestions(false));
  }, []);

  const handleRandomQuestion = useCallback(() => {
    if (!selectedMode) return;
    setLoadingQuestions(true);
    getRandomQuestion(selectedMode)
      .then((res) => {
        setSelectedQuestion(res.question);
        // Also refresh questions list to include it if needed
        setQuestions((prev) =>
          prev.includes(res.question) ? prev : [...prev, res.question]
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingQuestions(false));
  }, [selectedMode]);

  const handleStartFeedback = useCallback(() => {
    if (!selectedMode || !selectedQuestion || !role) {
      Alert.alert('Missing info', 'Please select a mode, question, and role.');
      return;
    }
    onGoToFeedback(selectedMode, selectedQuestion, role);
  }, [selectedMode, selectedQuestion, role, onGoToFeedback]);

  if (loadingModes) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <AppHeader title="Practice" showBack onBack={onBack} />
        <LoadingState message="Loading practice modes..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Practice" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <Card variant="dark">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Text style={styles.sectionTitle}>Select Mode</Text>
        <View style={styles.modesRow}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => handleSelectMode(mode)}
              style={[
                styles.modeChip,
                selectedMode === mode && styles.modeChipActive,
              ]}
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

        {loadingQuestions ? (
          <LoadingState message="Loading questions..." />
        ) : (
          <>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Questions</Text>
              <TouchableOpacity onPress={handleRandomQuestion}>
                <Text style={styles.linkText}>🎲 Random</Text>
              </TouchableOpacity>
            </View>

            {questions.length === 0 ? (
              <Text style={styles.emptyText}>No questions available.</Text>
            ) : (
              questions.map((q, idx) => (
                <TouchableOpacity
                  key={`${q}-${idx}`}
                  onPress={() => setSelectedQuestion(q)}
                  activeOpacity={0.8}
                >
                  <Card
                    variant={selectedQuestion === q ? 'dark' : 'light'}
                    style={selectedQuestion === q ? styles.selectedCard : undefined}
                  >
                    <Text
                      style={[
                        styles.questionText,
                        selectedQuestion === q && styles.questionTextActive,
                      ]}
                    >
                      {q}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.sectionTitle}>Target Role</Text>
            <Card>
              <Text style={styles.roleText}>{role}</Text>
            </Card>

            <View style={styles.actions}>
              <PrimaryButton
                title="Run AI Coach"
                onPress={handleStartFeedback}
                disabled={!selectedQuestion || !role}
              />
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
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  modeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  questionText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: '500',
    lineHeight: 22,
  },
  questionTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: fontSize.md,
    color: colors.background,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
