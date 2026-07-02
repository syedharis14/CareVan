import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverRosterStudent, TripEventType, TripType } from '@carevan/shared';
import { StudentStatus } from '../store/tripStore';
import { theme } from '../theme/theme';
import { StatusPill } from './StatusPill';

interface Props {
  student: DriverRosterStudent;
  status: StudentStatus;
  tripType: TripType;
  onRecord: (type: TripEventType) => void;
}

/** One roster row. Actions appear only while the student is still PENDING so a
 *  re-tap can't create a second BOARDED/DROPPED event (and a second parent alert). */
export function StudentRow({ student, status, tripType, onRecord }: Props) {
  const acted = status !== 'PENDING';

  return (
    <View style={styles.row}>
      <View style={styles.stop}>
        <Text style={styles.stopNo}>{student.stopOrder}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>{student.name}</Text>
        {student.pickupNotes ? <Text style={styles.notes}>{student.pickupNotes}</Text> : null}
        <View style={styles.statusRow}>
          <StatusPill status={status} />
        </View>
      </View>

      {!acted ? (
        <View style={styles.actions}>
          {tripType === 'PICKUP' ? (
            <>
              <ActionButton label="On board" tone="safe" onPress={() => onRecord('BOARDED')} />
              <ActionButton label="Absent" tone="muted" onPress={() => onRecord('ABSENT')} />
            </>
          ) : (
            <ActionButton label="Dropped" tone="primary" onPress={() => onRecord('DROPPED')} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'safe' | 'primary' | 'muted';
  onPress: () => void;
}) {
  const color =
    tone === 'safe'
      ? theme.colors.safe
      : tone === 'primary'
        ? theme.colors.primary
        : theme.colors.inkSoft;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, { borderColor: color }, pressed && styles.pressed]}
    >
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.cardShadow,
  },
  stop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stopNo: { color: theme.colors.primary, fontWeight: '700' },
  body: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600', color: theme.colors.ink },
  notes: { fontSize: 13, color: theme.colors.inkSoft, marginTop: 2 },
  statusRow: { marginTop: theme.spacing.xs },
  actions: { gap: theme.spacing.xs, marginLeft: theme.spacing.sm },
  action: {
    minHeight: 44,
    minWidth: 92,
    borderWidth: 1.5,
    borderRadius: theme.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
