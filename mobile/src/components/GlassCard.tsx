import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | undefined | false;
  noBorder?: boolean;
}

export default function GlassCard({ children, style, noBorder }: GlassCardProps) {
  return (
    <View style={[styles.container, noBorder && styles.noBorder, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    ...shadows.card,
  },
  noBorder: {
    borderWidth: 0,
  },
});
