import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import {
  getHealth,
  getBackendUrl,
  setBackendUrl,
  getSaveHistorySetting,
  setSaveHistorySetting,
  getSpeechAnalysisSetting,
  setSpeechAnalysisSetting,
} from '../api/pitchpilotApi';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const DEFAULT_URL = 'http://127.0.0.1:8000';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [backendUrl, setBackendUrlInput] = useState(getBackendUrl());
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [saveHistory, setSaveHistory] = useState(true);
  const [speechAnalysis, setSpeechAnalysis] = useState(true);
  const [testing, setTesting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    checkConnection();
    (async () => {
      const [sh, sa] = await Promise.all([
        getSaveHistorySetting(),
        getSpeechAnalysisSetting(),
      ]);
      setSaveHistory(sh);
      setSpeechAnalysis(sa);
      setLoadingSettings(false);
    })();
  }, []);

  const checkConnection = useCallback(async () => {
    setStatus('checking');
    try {
      await getHealth();
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  }, []);

  const handleTest = useCallback(async () => {
    setTesting(true);
    try {
      await getHealth();
      setStatus('online');
      Alert.alert('Success', 'Backend connection is healthy.');
    } catch (err) {
      setStatus('offline');
      Alert.alert(
        'Connection Failed',
        err instanceof Error ? err.message : 'Could not reach backend.'
      );
    } finally {
      setTesting(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    const url = backendUrl.trim();
    if (!url) {
      Alert.alert('Invalid URL', 'Please enter a valid backend URL.');
      return;
    }
    setBackendUrl(url);
    Alert.alert('Saved', 'Backend URL updated.');
    checkConnection();
  }, [backendUrl, checkConnection]);

  const handleReset = useCallback(() => {
    setBackendUrlInput(DEFAULT_URL);
    setBackendUrl(DEFAULT_URL);
    Alert.alert('Reset', 'Backend URL reset to default.');
    checkConnection();
  }, [checkConnection]);

  const handleToggleSaveHistory = useCallback(async (value: boolean) => {
    setSaveHistory(value);
    await setSaveHistorySetting(value);
  }, []);

  const handleToggleSpeechAnalysis = useCallback(async (value: boolean) => {
    setSpeechAnalysis(value);
    await setSpeechAnalysisSetting(value);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="rocket" size={20} color={colors.cyan} />
          </View>
          <Text style={styles.headerTitle}>PitchPilot AI</Text>
        </View>

        {/* Profile Block */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons
              name={isAuthenticated ? 'person' : 'person-outline'}
              size={28}
              color={isAuthenticated ? colors.cyan : colors.textMuted}
            />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {isAuthenticated && user ? user.name : 'Guest'}
            </Text>
            <Text style={styles.profileMode}>
              {isAuthenticated && user ? user.email : 'Not signed in'}
            </Text>
          </View>
        </GlassCard>

        {/* Account actions */}
        <Text style={styles.sectionLabel}>Account</Text>
        {isAuthenticated ? (
          <GradientButton
            title="Logout"
            variant="secondary"
            onPress={async () => {
              await logout();
              Alert.alert('Signed out', 'You have been signed out.');
            }}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />}
          />
        ) : (
          <View style={styles.authBtnRow}>
            <GradientButton
              title="Login"
              variant="secondary"
              onPress={() => router.push('/login' as any)}
              style={{ flex: 1 }}
              icon={<Ionicons name="log-in-outline" size={18} color={colors.textPrimary} />}
            />
            <View style={{ width: spacing.md }} />
            <GradientButton
              title="Register"
              onPress={() => router.push('/register' as any)}
              style={{ flex: 1 }}
              icon={<Ionicons name="person-add-outline" size={18} color="#fff" />}
            />
          </View>
        )}

        {/* Backend Engine Status */}
        <Text style={styles.sectionLabel}>Backend Engine</Text>
        <GlassCard>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <StatusBadge
              text={status === 'online' ? 'Connected' : status === 'offline' ? 'Offline' : 'Checking...'}
              variant={status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'default'}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Backend Endpoint</Text>
            <TextInput
              style={styles.urlInput}
              value={backendUrl}
              onChangeText={setBackendUrlInput}
              placeholder="http://127.0.0.1:8000"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.helpBox}>
            <Ionicons name="information-circle" size={16} color={colors.textMuted} />
            <View style={styles.helpTextBox}>
              <Text style={styles.helpText}>Real phone: http://YOUR_LAPTOP_IP:8000</Text>
              <Text style={styles.helpText}>Android emulator: http://10.0.2.2:8000</Text>
              <Text style={styles.helpText}>Local browser: http://127.0.0.1:8000</Text>
            </View>
          </View>
          <View style={styles.btnRow}>
            <GradientButton
              title={testing ? 'Testing...' : 'Test Connection'}
              variant="secondary"
              onPress={handleTest}
              disabled={testing}
            />
            <View style={{ width: spacing.md }} />
            <GradientButton
              title="Save Settings"
              onPress={handleSave}
              style={{ flex: 1 }}
            />
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
            <Text style={styles.resetText}>Reset to Default</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* AI Engine Provider */}
        <Text style={styles.sectionLabel}>AI Engine Provider</Text>
        <View style={styles.providerGrid}>
          <ProviderCard
            name="OpenAI-compatible"
            desc="GPT-4o, Claude, etc."
            icon="flash"
            active
          />
          <ProviderCard
            name="Google Gemini"
            desc="Coming soon"
            icon="logo-google"
            active={false}
          />
          <ProviderCard
            name="Local / Fallback"
            desc="Rule-based offline"
            icon="shield-checkmark"
            active={false}
          />
        </View>

        {/* Toggles */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        {loadingSettings ? (
          <Text style={styles.loadingText}>Loading preferences...</Text>
        ) : (
          <GlassCard>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Save Practice History</Text>
                <Text style={styles.toggleHint}>Store sessions to SQLite</Text>
              </View>
              <Switch
                value={saveHistory}
                onValueChange={handleToggleSaveHistory}
                trackColor={{ false: colors.cardBorder, true: colors.blue }}
                thumbColor={saveHistory ? colors.cyan : colors.textMuted}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Speech Analysis</Text>
                <Text style={styles.toggleHint}>Speech is analyzed from uploaded video audio</Text>
              </View>
              <Switch
                value={speechAnalysis}
                onValueChange={handleToggleSpeechAnalysis}
                trackColor={{ false: colors.cardBorder, true: colors.blue }}
                thumbColor={speechAnalysis ? colors.cyan : colors.textMuted}
              />
            </View>
          </GlassCard>
        )}

        {/* Navigation Links */}
        <Text style={styles.sectionLabel}>More</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/history')} activeOpacity={0.7}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>History</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/dashboard')} activeOpacity={0.7}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.linkText}>Dashboard</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProviderCard({
  name,
  desc,
  icon,
  active,
}: {
  name: string;
  desc: string;
  icon: string;
  active: boolean;
}) {
  return (
    <GlassCard style={[styles.providerCard, active ? styles.providerCardActive : {}]}>
      <Ionicons name={icon as any} size={22} color={active ? colors.cyan : colors.textMuted} />
      <Text style={[styles.providerName, active && styles.providerNameActive]}>{name}</Text>
      <Text style={styles.providerDesc}>{desc}</Text>
      {active && <View style={styles.providerDot} />}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(53,215,255,0.15)',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(53,215,255,0.15)',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileMode: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  authBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inputRow: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  urlInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  helpBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(79,140,255,0.06)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  helpTextBox: {
    flex: 1,
    gap: 2,
  },
  helpText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetBtn: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  resetText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: '600',
  },
  providerGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  providerCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    position: 'relative',
  },
  providerCardActive: {
    borderColor: colors.cyan,
  },
  providerName: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  providerNameActive: {
    color: colors.textPrimary,
  },
  providerDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  providerDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  toggleHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
});
