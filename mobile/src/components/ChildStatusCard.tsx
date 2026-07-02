import { ChildSummary } from '@carevan/shared';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { statusView } from '../utils/childStatus';

/** The emotional hero: a big, color-dominant status card. Tapping opens the live view. */
export function ChildStatusCard({ child, onPress }: { child: ChildSummary; onPress: () => void }) {
  const view = statusView(child.status);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => pressed && styles.pressed}
    >
      {child.sosActive ? (
        <View style={styles.sos}>
          <Text style={styles.sosText}>🚨 EMERGENCY — driver raised an SOS. Call them now.</Text>
        </View>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: theme.withAlpha(view.color, 0.12), borderColor: view.color },
        ]}
      >
        <Text style={styles.name}>{child.student.name}</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.icon, { color: view.color }]}>{view.icon}</Text>
          <Text style={[styles.status, { color: view.color }]}>{view.label}</Text>
        </View>
        {child.van ? (
          <Text style={styles.sub}>
            Van {child.van.plateNo} · {child.van.driverName}
          </Text>
        ) : (
          <Text style={styles.sub}>No van assigned yet</Text>
        )}
        {child.subscriptionStatus === 'UNPAID' ? (
          <Text style={styles.unpaid}>Subscription unpaid — please clear your dues.</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  card: {
    borderRadius: theme.radii.card,
    borderWidth: 1.5,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  name: { fontSize: 22, fontWeight: '800', color: theme.colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.sm },
  icon: { fontSize: 22, marginRight: theme.spacing.sm },
  status: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 14, color: theme.colors.inkSoft, marginTop: theme.spacing.md },
  unpaid: { fontSize: 13, color: theme.colors.ink, marginTop: theme.spacing.sm, fontWeight: '600' },
  sos: {
    backgroundColor: theme.colors.danger,
    borderTopLeftRadius: theme.radii.card,
    borderTopRightRadius: theme.radii.card,
    padding: theme.spacing.md,
  },
  sosText: { color: theme.colors.surface, fontWeight: '700', textAlign: 'center' },
});
