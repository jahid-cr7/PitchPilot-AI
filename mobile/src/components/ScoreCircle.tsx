import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../theme/theme';

interface ScoreCircleProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ScoreCircle({ score, size = 100, label }: ScoreCircleProps) {
  const clamped = Math.max(0, Math.min(100, score));
  let color = colors.error;
  if (clamped >= 70) color = colors.success;
  else if (clamped >= 50) color = colors.warning;
  else if (clamped >= 30) color = colors.primary;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      >
        <Text style={[styles.scoreText, { color, fontSize: size * 0.32 }]}>
          {clamped}
        </Text>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  circle: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scoreText: {
    fontWeight: '800',
  },
  label: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
