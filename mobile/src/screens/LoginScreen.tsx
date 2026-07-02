import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { normalizePkPhone } from '@carevan/shared';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme/theme';

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setBusy(true);
    try {
      await login(normalizePkPhone(phone), pin);
    } catch {
      // error surfaced via the store
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = phone.trim().length >= 10 && pin.length >= 4;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>CareVan</Text>
        <Text style={styles.tagline}>Your child, tracked safely.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="03XX XXXXXXX"
          placeholderTextColor={theme.colors.inkSoft}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <Text style={styles.label}>PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="••••"
          placeholderTextColor={theme.colors.inkSoft}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Sign in"
          onPress={onSubmit}
          disabled={!canSubmit}
          loading={busy}
          style={styles.submit}
        />
        <Text style={styles.help}>
          Accounts are set up by CareVan. Contact us if you can&apos;t sign in.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  brandBlock: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  brand: { fontSize: 40, fontWeight: '800', color: theme.colors.primary },
  tagline: { fontSize: 16, color: theme.colors.inkSoft, marginTop: theme.spacing.xs },
  form: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.xl,
    ...theme.cardShadow,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 18,
    color: theme.colors.ink,
    backgroundColor: theme.colors.bg,
  },
  error: { color: theme.colors.danger, marginTop: theme.spacing.md, fontSize: 14 },
  submit: { marginTop: theme.spacing.xl },
  help: {
    fontSize: 13,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
