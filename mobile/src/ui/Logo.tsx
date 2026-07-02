import { Image, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { Text } from './Text';

// The final brand tile (blue square + van cradled in green arms), generated from brand/icon.svg.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- RN static asset require
const ICON = require('../../assets/icon.png');

/** CareVan lockup: the brand tile + an Inter wordmark. */
export function Logo({
  size = 40,
  wordmark = true,
  onDark = false,
}: {
  size?: number;
  wordmark?: boolean;
  onDark?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Image source={ICON} style={{ width: size, height: size, borderRadius: size * 0.26 }} />
      {wordmark ? (
        <Text variant="h2" color={onDark ? colors.surface : colors.primary} style={styles.word}>
          CareVan
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { marginLeft: spacing.md, letterSpacing: -0.4 },
});
