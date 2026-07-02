import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'safe' | 'danger' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const FILL: Record<Variant, string> = {
  primary: colors.primary,
  safe: colors.safe,
  danger: colors.danger,
  secondary: colors.fill,
  ghost: 'transparent',
};
const FG: Record<Variant, string> = {
  primary: colors.surface,
  safe: colors.surface,
  danger: colors.surface,
  secondary: colors.primary,
  ghost: colors.primary,
};

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  loading,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const fg = FG[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { height: size === 'lg' ? 54 : 44, backgroundColor: FILL[variant] },
        variant === 'ghost' && styles.ghost,
        variant === 'secondary' && styles.secondary,
        fullWidth && styles.full,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={19} color={fg} /> : null}
          <Text variant="button" color={fg}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
  },
  full: { alignSelf: 'stretch' },
  ghost: { borderWidth: 1.5, borderColor: colors.primary },
  secondary: { borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
