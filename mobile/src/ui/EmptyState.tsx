import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, withAlpha } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name={icon} size={30} color={colors.primary} />
      </View>
      <Text variant="title" center>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" color={colors.inkSoft} center style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  badge: {
    width: 68,
    height: 68,
    borderRadius: radii.xl,
    backgroundColor: withAlpha(colors.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  sub: { marginTop: spacing.sm, maxWidth: 300 },
});
