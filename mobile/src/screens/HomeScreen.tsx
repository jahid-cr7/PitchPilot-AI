import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../theme/theme';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';

interface HomeScreenProps {
  onStartPractice: () => void;
  onNavigate: (screen: 'settings') => void;
}

export default function HomeScreen({ onStartPractice, onNavigate }: HomeScreenProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>PitchPilot AI</Text>
          <Text style={styles.tagline}>
            AI-powered interview and presentation coaching
          </Text>
        </View>

        <View style={styles.features}>
          <Card>
            <Text style={styles.cardTitle}>🎯 AI Coaching</Text>
            <Text style={styles.cardDesc}>
              Get instant AI feedback on your answers, structure, and delivery.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>📚 Question Bank</Text>
            <Text style={styles.cardDesc}>
              Practice with curated questions across multiple interview modes.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>📈 Progress Ready</Text>
            <Text style={styles.cardDesc}>
              Track your improvement over time with detailed scoring.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>📊 Reports Ready</Text>
            <Text style={styles.cardDesc}>
              Generate actionable reports to sharpen your weak points.
            </Text>
          </Card>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Start Practice" onPress={onStartPractice} />
          <View style={styles.spacer} />
          <PrimaryButton
            title="Settings"
            variant="outline"
            onPress={() => onNavigate('settings')}
          />
        </View>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  logo: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  features: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.md,
  },
  spacer: {
    height: spacing.md,
  },
});
