import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, elevation, radii, spacing } from '../theme/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  /** 'flat' = hairline border, 'raised' = soft shadow. */
  variant?: 'flat' | 'raised';
}

export function Card({ children, onPress, style, padded = true, variant = 'raised' }: Props) {
  const base = [
    styles.card,
    variant === 'raised' ? elevation.md : styles.flat,
    padded && styles.padded,
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg },
  flat: { borderWidth: 1, borderColor: colors.border },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
});
