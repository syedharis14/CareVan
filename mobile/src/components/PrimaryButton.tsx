import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '../theme/theme';

type Variant = 'primary' | 'safe' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

const bg: Record<Variant, string> = {
  primary: theme.colors.primary,
  safe: theme.colors.safe,
  danger: theme.colors.danger,
  ghost: theme.colors.surface,
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg[variant] },
        isGhost && styles.ghostBorder,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isGhost ? theme.colors.primary : theme.colors.surface} />
      ) : (
        <Text
          style={[styles.label, { color: isGhost ? theme.colors.primary : theme.colors.surface }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: theme.touch.minTargetPx,
    borderRadius: theme.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
  },
  ghostBorder: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  label: {
    fontSize: theme.typography.driverActionSizeMin,
    fontWeight: '600',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
