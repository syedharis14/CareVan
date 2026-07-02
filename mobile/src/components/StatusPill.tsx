import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { StudentStatus } from '../store/tripStore';

/** Status is never color-only — every pill pairs an icon glyph with a text label. */
const MAP: Record<StudentStatus, { label: string; icon: string; color: string }> = {
  PENDING: { label: 'Waiting', icon: '•', color: theme.colors.inkSoft },
  BOARDED: { label: 'On board', icon: '✓', color: theme.colors.safe },
  DROPPED: { label: 'Dropped', icon: '✓', color: theme.colors.primary },
  ABSENT: { label: 'Absent', icon: '—', color: theme.colors.transit },
};

export function StatusPill({ status }: { status: StudentStatus }) {
  const s = MAP[status];
  return (
    <View style={[styles.pill, { backgroundColor: theme.withAlpha(s.color, 0.12) }]}>
      <Text style={[styles.text, { color: s.color }]}>
        {s.icon} {s.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 13, fontWeight: '600' },
});
