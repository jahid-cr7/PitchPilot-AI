import { View, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';

export function WebBadge() {
  return (
    <View style={styles.container}>
      <ThemedText type="code" themeColor="textSecondary" style={styles.versionText}>
        PitchPilot AI
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versionText: {
    textAlign: 'center',
  },
});
