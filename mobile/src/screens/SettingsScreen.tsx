import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import { getBackendUrl, setBackendUrl, getHealth } from '../api/pitchpilotApi';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';

const DEFAULT_URL = 'http://127.0.0.1:8000';

export default function SettingsScreen() {
  const [url, setUrl] = useState(getBackendUrl());
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const handleSave = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBackendUrl(trimmed);
    setSaved(true);
    setTestStatus('idle');
    setTimeout(() => setSaved(false), 2000);
  }, [url]);

  const handleReset = useCallback(() => {
    setBackendUrl(DEFAULT_URL);
    setUrl(DEFAULT_URL);
    setSaved(true);
    setTestStatus('idle');
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleTest = useCallback(async () => {
    setTestStatus('testing');
    try {
      await getHealth();
      setTestStatus('ok');
    } catch {
      setTestStatus('fail');
    }
  }, []);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Backend connection</Text>

        {/* URL Input */}
        <Card>
          <Text style={styles.label}>Backend URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="http://127.0.0.1:8000"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <PrimaryButton title={saved ? 'Saved!' : 'Save URL'} onPress={handleSave} />
          <Text style={styles.inputHint}>
            Use your laptop LAN IP when on a physical phone.
          </Text>
        </Card>

        {/* Test + Reset */}
        <View style={styles.rowButtons}>
          <PrimaryButton
            title="Test Connection"
            variant="secondary"
            onPress={handleTest}
            loading={testStatus === 'testing'}
          />
          <PrimaryButton title="Reset Default" variant="outline" onPress={handleReset} />
        </View>

        {testStatus === 'ok' && (
          <Card variant="dark">
            <Text style={styles.testOk}>✅ Backend is reachable!</Text>
          </Card>
        )}
        {testStatus === 'fail' && (
          <Card variant="dark">
            <Text style={styles.testFail}>
              ❌ Cannot reach backend. Check the URL and make sure the server is running.
            </Text>
          </Card>
        )}

        {/* Connection Notes */}
        <Text style={styles.sectionTitle}>Connection Notes</Text>
        <Card variant="dark">
          <Text style={styles.noteLabel}>Local Browser</Text>
          <Text style={styles.noteValue}>http://127.0.0.1:8000</Text>

          <Text style={styles.noteLabel}>Android Emulator</Text>
          <Text style={styles.noteValue}>http://10.0.2.2:8000</Text>
          <Text style={styles.noteDesc}>
            The Android emulator cannot reach 127.0.0.1 on the host. Use 10.0.2.2 instead.
          </Text>

          <Text style={styles.noteLabel}>Physical Phone</Text>
          <Text style={styles.noteValue}>http://192.168.x.x:8000</Text>
          <Text style={styles.noteDesc}>
            Use your computer LAN IP. Both devices must be on the same Wi-Fi.
          </Text>
        </Card>
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
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.background,
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
  inputHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  testOk: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  testFail: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  noteLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  noteValue: {
    fontSize: fontSize.sm,
    color: colors.primaryLight,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginTop: spacing.xs,
  },
  noteDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
