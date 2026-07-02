import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, withAlpha } from '../theme/theme';
import { Icon, Text } from '../ui';

/** Daily driver-safety strip. GPS overspeed only in v1. */
export function SafetyStrip({ overspeedCount }: { overspeedCount: number }) {
  const safe = overspeedCount === 0;
  const color = safe ? colors.safe : colors.danger;
  return (
    <View style={[styles.strip, { backgroundColor: withAlpha(color, 0.1) }]}>
      <View style={[styles.iconWrap, { backgroundColor: withAlpha(color, 0.16) }]}>
        <Icon name={safe ? 'shield-checkmark' : 'warning'} size={19} color={color} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyMd" color={color}>
          {safe
            ? 'Safe driving today'
            : `${overspeedCount} speeding alert${overspeedCount === 1 ? '' : 's'} today`}
        </Text>
        <Text variant="caption" color={colors.inkSoft}>
          {safe ? 'No speeding detected' : 'GPS overspeed on the route'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
