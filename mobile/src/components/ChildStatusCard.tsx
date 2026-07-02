import { ChildSummary } from '@carevan/shared';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { Avatar, Card, Chip, Icon, Stepper, Text } from '../ui';
import { journey, statusView } from '../utils/childStatus';

/** The parent home hero: avatar, live status, and the child's journey stepper. */
export function ChildStatusCard({ child, onPress }: { child: ChildSummary; onPress: () => void }) {
  const view = statusView(child.status);
  const { steps, current } = journey(child.status, child.activeTrip?.type);

  return (
    <Card onPress={onPress} padded={false} style={styles.card}>
      {child.sosActive ? (
        <View style={styles.sos}>
          <Icon name="warning" size={15} color={colors.surface} />
          <Text variant="label" color={colors.surface}>
            Emergency — the driver raised an SOS
          </Text>
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.head}>
          <Avatar name={child.student.name} color={view.color} size={48} />
          <View style={styles.headText}>
            <Text variant="title" numberOfLines={1}>
              {child.student.name}
            </Text>
            <Text variant="caption" color={colors.inkSoft}>
              {child.van
                ? `Van ${child.van.plateNo} · ${child.van.driverName}`
                : 'No van assigned yet'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.inkSoft} />
        </View>

        <View style={styles.statusRow}>
          <Chip label={view.label} tone={view.tone} icon={view.icon} />
          {child.subscriptionStatus === 'UNPAID' ? (
            <Chip label="Unpaid" tone="transit" icon="alert-circle" />
          ) : null}
        </View>

        <View style={styles.stepper}>
          <Stepper steps={steps} current={current} accent={view.color} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, overflow: 'hidden' },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  body: { padding: spacing.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headText: { flex: 1 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  stepper: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
