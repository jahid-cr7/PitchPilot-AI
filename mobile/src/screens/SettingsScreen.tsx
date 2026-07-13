import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../theme/theme';
import { getBackendUrl, setBackendUrl } from '../api/pitchpilotApi';
import AppHeader from '../components/AppHeader';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [url, setUrl] = useState(getBackendUrl());
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setBackendUrl(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [url]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <AppHeader title="Settings" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Backend URL</Text>
        <Card>
          <Text style={styles.label}>Current Backend URL</Text>
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
        </Card>

        <Text style={styles.sectionTitle}>Connection Notes</Text>
        <Card>
          <Text style={styles.noteTitle}>Default</Text>
          <Text style={styles.noteValue}>http://127.0.0.1:8000</Text>

          <Text style={styles.noteTitle}>Android Emulator</Text>
          <Text style={styles.noteValue}>http://10.0.2.2:8000</Text>
          <Text style={styles.noteDesc}>
            The Android emulator cannot reach 127.0.0.1 on the host. Use 10.0.2.2 instead.
          </Text>

          <Text style={styles.noteTitle}>Physical Phone</Text>
          <Text style={styles.noteValue}>http://192.168.x.x:8000</Text>
          <Text style={styles.noteDesc}>
            Use your computer's LAN IP address. Both devices must be on the same Wi-Fi network.
          </Text>
        </Card>

        <Text style={styles.sectionTitle}>Provider Hints</Text>
        <Card>
          <Text style={styles.noteTitle}>OpenAI</Text>
          <Text style={styles.noteValue}>https://api.openai.com/v1</Text>

          <Text style={styles.noteTitle}>Gemini (OpenAI compatible)</Text>
          <Text style={styles.noteValue}>
            https://generativelanguage.googleapis.com/v1beta/openai/
          </Text>
          <Text style={styles.noteDesc}>Model: gemini-3.5-flash</Text>

          <Text style={styles.noteTitle}>Groq</Text>
          <Text style={styles.noteValue}>https://api.groq.com/openai/v1</Text>
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
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
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
  noteTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.background,
    marginTop: spacing.sm,
  },
  noteValue: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  noteDesc: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
