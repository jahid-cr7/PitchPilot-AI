import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'light' | 'dark';
}

export default function Card({ children, style, variant = 'light' }: CardProps) {
  const isDark = variant === 'dark';
  return (
    <View
      style={[
        styles.card,
        isDark ? styles.darkCard : styles.lightCard,
        shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
  },
  lightCard: {
    backgroundColor: colors.card,
  },
  darkCard: {
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
});
