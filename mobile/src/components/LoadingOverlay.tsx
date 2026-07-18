import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

interface LoadingOverlayProps {
  message?: string;
  steps?: string[];
  currentStep?: number;
}

export default function LoadingOverlay({
  message = 'Analyzing...',
  steps,
  currentStep = 0,
}: LoadingOverlayProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.cyan} />
      <Text style={styles.message}>{message}</Text>
      {steps && steps.length > 0 && (
        <View style={styles.steps}>
          {steps.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <View
                style={[
                  styles.dot,
                  i < currentStep
                    ? styles.dotCompleted
                    : i === currentStep
                    ? styles.dotActive
                    : styles.dotPending,
                ]}
              />
              <Text
                style={[
                  styles.stepText,
                  i < currentStep
                    ? styles.stepCompleted
                    : i === currentStep
                    ? styles.stepActive
                    : styles.stepPending,
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8,18,37,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: spacing.xxl,
  },
  message: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  steps: {
    marginTop: spacing.xl,
    width: '100%',
    maxWidth: 280,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotActive: {
    backgroundColor: colors.cyan,
  },
  dotPending: {
    backgroundColor: colors.cardBorder,
  },
  stepText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  stepCompleted: {
    color: colors.success,
  },
  stepActive: {
    color: colors.cyan,
  },
  stepPending: {
    color: colors.textMuted,
  },
});
