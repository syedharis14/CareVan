import { Alert, Linking, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { Avatar, Button, Card, Text } from '../ui';

/** Driver + van, with a native tel: call button (no in-app calling/chat — v1 scope). */
export function DriverCard({
  plateNo,
  driverName,
  driverPhone,
}: {
  plateNo: string;
  driverName: string;
  driverPhone: string;
}) {
  const first = driverName.split(' ')[0] ?? 'driver';
  return (
    <Card>
      <Text variant="label" color={colors.inkSoft} style={styles.label}>
        YOUR DRIVER
      </Text>
      <View style={styles.row}>
        <Avatar name={driverName} color={colors.primary} />
        <View style={styles.info}>
          <Text variant="title">{driverName}</Text>
          <Text variant="caption" color={colors.inkSoft}>
            Van {plateNo}
          </Text>
        </View>
      </View>
      <Button
        label={`Call ${first}`}
        variant="secondary"
        icon="call"
        onPress={() =>
          void Linking.openURL(`tel:${driverPhone}`).catch(() =>
            Alert.alert('Cannot place call', `Dial ${driverPhone} manually.`),
          )
        }
        style={styles.call}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  info: { flex: 1 },
  call: { marginTop: spacing.lg },
});
