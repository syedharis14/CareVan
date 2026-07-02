import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

/** Daily driver-safety strip. GPS-overspeed only in v1. */
export function SafetyStrip({ overspeedCount }: { overspeedCount: number }) {
  const safe = overspeedCount === 0;
  const color = safe ? theme.colors.safe : theme.colors.danger;
  return (
    <View style={[styles.strip, { backgroundColor: theme.withAlpha(color, 0.12) }]}>
      <Text style={[styles.icon, { color }]}>{safe ? '✓' : '⚠'}</Text>
      <Text style={[styles.text, { color }]}>
        {safe
          ? 'Safe driving today — no speeding'
          : `${overspeedCount} speeding alert${overspeedCount === 1 ? '' : 's'} today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.button,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  icon: { fontSize: 18, marginRight: theme.spacing.sm },
  text: { fontSize: 15, fontWeight: '600' },
});
