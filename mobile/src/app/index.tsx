import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import Card from '../components/Card';
import { getHealth, getBackendUrl } from '../api/pitchpilotApi';

export default function HomeScreen() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    let mounted = true;
    getHealth()
      .then(() => {
        if (mounted) setStatus('online');
      })
      .catch(() => {
        if (mounted) setStatus('offline');
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>PitchPilot AI</Text>
          <Text style={styles.tagline}>
            AI-powered interview and presentation coaching
          </Text>
          <Text style={styles.url}>{getBackendUrl()}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.dot,
                status === 'online'
                  ? styles.dotOnline
                  : status === 'offline'
                  ? styles.dotOffline
                  : styles.dotChecking,
              ]}
            />
            <Text style={styles.statusText}>
              {status === 'online'
                ? 'Backend connected'
                : status === 'offline'
                ? 'Backend offline'
                : 'Checking backend...'}
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          <Card>
            <Text style={styles.cardTitle}>🎯 AI Coaching</Text>
            <Text style={styles.cardDesc}>
              Get instant AI feedback on your answers, structure, and delivery.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>📊 Dashboard</Text>
            <Text style={styles.cardDesc}>
              Track your improvement over time with detailed scoring analytics.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>📚 History</Text>
            <Text style={styles.cardDesc}>
              Review past sessions, transcripts, scores, and export reports.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>⚙️ Settings</Text>
            <Text style={styles.cardDesc}>
              Configure backend URL and connection options.
            </Text>
          </Card>
        </View>

        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>Connection Notes</Text>
          <Text style={styles.hintText}>Default: http://127.0.0.1:8000</Text>
          <Text style={styles.hintText}>Android Emulator: http://10.0.2.2:8000</Text>
          <Text style={styles.hintText}>Physical Phone: use your laptop LAN IP</Text>
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
  url: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: colors.success,
  },
  dotOffline: {
    backgroundColor: colors.error,
  },
  dotChecking: {
    backgroundColor: colors.warning,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
  hintBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  hintTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
});
