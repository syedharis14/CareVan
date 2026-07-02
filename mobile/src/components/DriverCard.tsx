import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { theme } from '../theme/theme';

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
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your driver</Text>
      <Text style={styles.name}>{driverName}</Text>
      <Text style={styles.plate}>Van {plateNo}</Text>
      <PrimaryButton
        label={`Call ${driverName.split(' ')[0] ?? 'driver'}`}
        variant="ghost"
        onPress={() =>
          void Linking.openURL(`tel:${driverPhone}`).catch(() =>
            Alert.alert('Cannot place call', `Dial ${driverPhone} manually.`),
          )
        }
        style={styles.call}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    ...theme.cardShadow,
  },
  label: { fontSize: 13, color: theme.colors.inkSoft, fontWeight: '600' },
  name: { fontSize: 18, fontWeight: '700', color: theme.colors.ink, marginTop: 2 },
  plate: { fontSize: 15, color: theme.colors.inkSoft, marginTop: 2 },
  call: { marginTop: theme.spacing.md },
});
