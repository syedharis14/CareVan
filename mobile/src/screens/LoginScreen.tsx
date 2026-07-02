import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalizePkPhone } from '@carevan/shared';
import { useAuthStore } from '../store/authStore';
import { colors, radii, spacing, type } from '../theme/theme';
import { Button, Card, Icon, IconName, Logo, Text } from '../ui';

function Field({
  label,
  icon,
  ...input
}: { label: string; icon: IconName } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text variant="label" color={colors.inkSoft} style={styles.fieldLabel}>
        {label}
      </Text>
      <View style={styles.inputWrap}>
        <Icon name={icon} size={19} color={colors.inkSoft} />
        <TextInput style={styles.input} placeholderTextColor={colors.inkSoft} {...input} />
      </View>
    </View>
  );
}

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
      /* error surfaced via the store */
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = phone.trim().length >= 10 && pin.length >= 4;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brand}>
            <Logo size={72} wordmark={false} />
            <Text variant="display" color={colors.primary} style={styles.name}>
              CareVan
            </Text>
            <Text variant="bodyLg" color={colors.inkSoft}>
              Your child, tracked safely.
            </Text>
          </View>

          <Card>
            <Field
              label="PHONE NUMBER"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              placeholder="03XX XXXXXXX"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
            <Field
              label="PIN"
              icon="lock-closed-outline"
              value={pin}
              onChangeText={setPin}
              placeholder="••••"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />

            {error ? (
              <View style={styles.error}>
                <Icon name="alert-circle" size={16} color={colors.ink} />
                <Text variant="caption" color={colors.ink}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Sign in"
              icon="arrow-forward"
              onPress={onSubmit}
              disabled={!canSubmit}
              loading={busy}
              style={styles.submit}
            />
          </Card>

          <Text variant="caption" color={colors.inkSoft} center style={styles.help}>
            Accounts are set up by CareVan. Contact us if you can&apos;t sign in.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  name: { marginTop: spacing.lg },
  field: { marginBottom: spacing.lg },
  fieldLabel: { marginBottom: spacing.sm, letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg,
  },
  input: { flex: 1, paddingVertical: spacing.md, ...type.bodyLg, color: colors.ink },
  error: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
  help: { marginTop: spacing.xl },
});
