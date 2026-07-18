import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, borderRadius } from '../theme';

interface StatusBadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export default function StatusBadge({ text, variant = 'default' }: StatusBadgeProps) {
  const variantStyles = {
    success: { bg: 'rgba(66,230,164,0.12)', text: colors.success, border: 'rgba(66,230,164,0.25)' },
    warning: { bg: 'rgba(255,193,7,0.12)', text: colors.warning, border: 'rgba(255,193,7,0.25)' },
    danger: { bg: 'rgba(255,143,143,0.12)', text: colors.danger, border: 'rgba(255,143,143,0.25)' },
    info: { bg: 'rgba(53,215,255,0.12)', text: colors.cyan, border: 'rgba(53,215,255,0.25)' },
    default: { bg: 'rgba(168,179,207,0.10)', text: colors.textSecondary, border: 'rgba(168,179,207,0.20)' },
  };

  const v = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: v.bg, borderColor: v.border }]}>
      <Text style={[styles.text, { color: v.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
