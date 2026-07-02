import { DriverRosterStudent, TripEventType, TripType } from '@carevan/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { StudentStatus } from '../store/tripStore';
import { colors, radii, spacing, withAlpha } from '../theme/theme';
import { Card, Chip, IconName, Text } from '../ui';
import { Tone } from '../ui/Chip';

const ACTED: Record<
  Exclude<StudentStatus, 'PENDING'>,
  { label: string; tone: Tone; icon: IconName }
> = {
  BOARDED: { label: 'On board', tone: 'safe', icon: 'checkmark-circle' },
  DROPPED: { label: 'Dropped off', tone: 'primary', icon: 'checkmark-circle' },
  ABSENT: { label: 'Absent', tone: 'transit', icon: 'remove-circle' },
};

function MiniButton({
  label,
  color,
  onPress,
  outline,
}: {
  label: string;
  color: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mini,
        outline ? { borderWidth: 1.5, borderColor: color } : { backgroundColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="label" color={outline ? color : colors.surface}>
        {label}
      </Text>
    </Pressable>
  );
}

/** One roster row. Actions show only while PENDING so a re-tap can't double-fire an event. */
export function StudentRow({
  student,
  status,
  tripType,
  onRecord,
}: {
  student: DriverRosterStudent;
  status: StudentStatus;
  tripType: TripType;
  onRecord: (type: TripEventType) => void;
}) {
  const acted = status !== 'PENDING' ? ACTED[status] : null;

  return (
    <Card style={styles.row}>
      <View style={styles.stop}>
        <Text variant="label" color={colors.primary}>
          {student.stopOrder}
        </Text>
      </View>

      <View style={styles.body}>
        <Text variant="bodyLg">{student.name}</Text>
        {student.pickupNotes ? (
          <Text variant="caption" color={colors.inkSoft} style={styles.notes}>
            {student.pickupNotes}
          </Text>
        ) : null}
        {acted ? (
          <View style={styles.chip}>
            <Chip label={acted.label} tone={acted.tone} icon={acted.icon} />
          </View>
        ) : null}
      </View>

      {!acted ? (
        <View style={styles.actions}>
          {tripType === 'PICKUP' ? (
            <>
              <MiniButton
                label="On board"
                color={colors.safe}
                onPress={() => onRecord('BOARDED')}
              />
              <MiniButton
                label="Absent"
                color={colors.inkSoft}
                outline
                onPress={() => onRecord('ABSENT')}
              />
            </>
          ) : (
            <MiniButton
              label="Dropped"
              color={colors.primary}
              onPress={() => onRecord('DROPPED')}
            />
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stop: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    backgroundColor: withAlpha(colors.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  notes: { marginTop: 2 },
  chip: { marginTop: spacing.sm },
  actions: { gap: spacing.sm },
  mini: {
    minHeight: 40,
    minWidth: 96,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.8 },
});
