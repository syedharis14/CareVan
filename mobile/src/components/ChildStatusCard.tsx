import { ChildSummary } from '@carevan/shared';
import { StyleSheet, View } from 'react-native';
import { colors, spacing, withAlpha } from '../theme/theme';
import { Avatar, Card, Chip, Icon, Stepper, Text } from '../ui';
import { journey, statusView } from '../utils/childStatus';
import { etaMinutes } from '../utils/geo';

/** The parent home hero: avatar, live status, ETA, the journey stepper, and today's safety. */
export function ChildStatusCard({ child, onPress }: { child: ChildSummary; onPress: () => void }) {
  const view = statusView(child.status);
  const { steps, current } = journey(child.status, child.activeTrip?.type);

  const ping = child.activeTrip?.lastPing ?? null;
  const pickup = child.activeTrip?.type === 'PICKUP';
  const dest = pickup ? child.school : child.home;
  const eta =
    ping && child.activeTrip ? etaMinutes(ping.lat, ping.lng, dest.lat, dest.lng, ping.speedKmh) : null;

  const safe = child.todayOverspeedCount === 0;
  const safeColor = safe ? colors.safe : colors.danger;

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
            <Text variant="caption" color={colors.inkSoft} numberOfLines={1}>
              {child.van
                ? `Van ${child.van.plateNo} · ${child.van.driverName}`
                : 'No van assigned yet'}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.inkSoft} />
        </View>

        <View style={styles.statusRow}>
          <Chip label={view.label} tone={view.tone} icon={view.icon} />
          {view.enRoute && eta != null ? (
            <Chip label={`~${eta} min`} tone="transit" icon="time" />
          ) : null}
          {child.subscriptionStatus === 'UNPAID' ? (
            <Chip label="Unpaid" tone="transit" icon="alert-circle" />
          ) : null}
        </View>

        <View style={styles.section}>
          <Stepper steps={steps} current={current} accent={view.color} />
          <View style={styles.safetyMini}>
            <View style={[styles.safetyDot, { backgroundColor: withAlpha(safeColor, 0.14) }]}>
              <Icon
                name={safe ? 'shield-checkmark' : 'warning'}
                size={13}
                color={safeColor}
              />
            </View>
            <Text variant="caption" color={colors.inkSoft}>
              {safe
                ? 'Safe driving today'
                : `${child.todayOverspeedCount} speeding alert${
                    child.todayOverspeedCount === 1 ? '' : 's'
                  } today`}
            </Text>
          </View>
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
  section: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  safetyMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  safetyDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
