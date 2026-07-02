import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing, withAlpha } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export type Tone = 'safe' | 'transit' | 'danger' | 'primary' | 'neutral';

const TONE: Record<Tone, string> = {
  safe: colors.safe,
  transit: colors.transit,
  danger: colors.danger,
  primary: colors.primary,
  neutral: colors.inkSoft,
};

/** Status pill — color + text (never color alone), optional leading icon. */
export function Chip({
  label,
  tone = 'neutral',
  icon,
  solid,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
  solid?: boolean;
}) {
  const c = TONE[tone];
  return (
    <View style={[styles.chip, { backgroundColor: solid ? c : withAlpha(c, 0.13) }]}>
      {icon ? <Icon name={icon} size={13} color={solid ? colors.surface : c} /> : null}
      <Text variant="caption" color={solid ? colors.surface : c}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
});
