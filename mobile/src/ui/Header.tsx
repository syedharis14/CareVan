import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

/** Circular icon button (header actions, back). 44px hit target. */
export function IconButton({
  icon,
  onPress,
  color = colors.ink,
  bg = colors.surface,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  bg?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: bg }, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
}

/** App bar: optional back, title/subtitle, and a right slot. */
export function Header({
  title,
  subtitle,
  onBack,
  right,
  left,
}: {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <IconButton icon="chevron-back" onPress={onBack} accessibilityLabel="Go back" />
        ) : (
          left
        )}
      </View>
      <View style={styles.center}>
        {title ? (
          <Text variant="title" center numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" color={colors.inkSoft} center numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  side: { minWidth: 44, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});
