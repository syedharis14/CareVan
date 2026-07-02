import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useTripStore } from '../store/tripStore';
import { colors, radii, spacing } from '../theme/theme';
import { Icon, Text } from '../ui';

/** The one place danger-red belongs in the driver app. Two-step to avoid mis-taps. */
export function SosButton() {
  const triggerSos = useTripStore((s) => s.triggerSos);
  const [sending, setSending] = useState(false);

  const confirm = () => {
    Alert.alert(
      'Send SOS?',
      'This alerts all parents on your van that you need help. Only use it in a real emergency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setSending(true);
            try {
              const count = await triggerSos();
              Alert.alert('SOS sent', `${count} parent${count === 1 ? '' : 's'} were alerted.`);
            } catch {
              Alert.alert('SOS failed', 'Could not send. Check your connection and try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send SOS emergency alert"
      onPress={confirm}
      disabled={sending}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        sending && styles.disabled,
      ]}
    >
      <Icon name="warning" size={18} color={colors.surface} />
      <Text variant="button" color={colors.surface} style={styles.label}>
        {sending ? 'Sending…' : 'SOS'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.danger,
  },
  label: { letterSpacing: 1 },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
});
