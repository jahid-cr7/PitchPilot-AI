import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AuthApiError } from '../api/authApi';
import GradientButton from '../components/GradientButton';
import GlassCard from '../components/GlassCard';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ next?: string }>();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRoute = typeof params.next === 'string' && params.next ? params.next : '/';

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextRoute as any);
    }
  }, [isAuthenticated, nextRoute, router]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in every field.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password);
      router.replace(nextRoute as any);
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [name, email, password, confirm, register, router, nextRoute]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="rocket" size={22} color={colors.cyan} />
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Save your practice history and track your progress.</Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!submitting}
                placeholder="Jahid Hasan"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!submitting}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Confirm password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!submitting}
                placeholder="Repeat your password"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            {error && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <GradientButton
              title={submitting ? 'Creating account…' : 'Create account'}
              onPress={handleSubmit}
              disabled={submitting}
              style={{ marginTop: spacing.lg }}
              icon={<Ionicons name="person-add-outline" size={18} color="#fff" />}
            />
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() =>
                router.push({ pathname: '/login', params: { next: nextRoute } } as any)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={14} color={colors.textMuted} />
            <Text style={styles.backText}>Back to home</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(53,215,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(53,215,255,0.15)',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,143,143,0.25)',
    backgroundColor: 'rgba(255,143,143,0.08)',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  footerLink: {
    color: colors.blue,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  backBtn: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
