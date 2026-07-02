import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { Logo } from './Logo';
import { Text } from './Text';

/** Branded loading screen shown while fonts hydrate. */
export function Splash() {
  return (
    <View style={styles.wrap}>
      <Logo size={72} />
      <Text variant="body" color={colors.inkSoft} style={styles.tag}>
        Your child, tracked safely.
      </Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  tag: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.xxl },
});
