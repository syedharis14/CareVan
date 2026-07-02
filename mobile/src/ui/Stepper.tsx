import { StyleSheet, View } from 'react-native';
import { colors, spacing, withAlpha } from '../theme/theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export interface Step {
  icon: IconName;
  label: string;
}

/**
 * The child's journey (Home → On the van → School). Steps before `current` are done
 * (safe green + check), `current` is active (amber/transit), later steps are pending.
 */
export function Stepper({
  steps,
  current,
  accent = colors.transit,
}: {
  steps: Step[];
  current: number;
  accent?: string;
}) {
  return (
    <View style={styles.row}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const nodeColor = done ? colors.safe : active ? accent : colors.inkSoft;
        return (
          <View key={step.label} style={styles.cell}>
            <View style={styles.line}>
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      i === 0 ? 'transparent' : i <= current ? colors.safe : colors.border,
                  },
                ]}
              />
              <View
                style={[
                  styles.node,
                  {
                    borderColor: nodeColor,
                    backgroundColor: done || active ? nodeColor : colors.surface,
                  },
                ]}
              >
                <Icon
                  name={done ? 'checkmark' : step.icon}
                  size={16}
                  color={done || active ? colors.surface : colors.inkSoft}
                />
              </View>
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor:
                      i === steps.length - 1
                        ? 'transparent'
                        : i < current
                          ? colors.safe
                          : colors.border,
                  },
                ]}
              />
            </View>
            <Text
              variant="caption"
              color={active ? colors.ink : colors.inkSoft}
              center
              style={styles.label}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  connector: { flex: 1, height: 2, borderRadius: 1 },
  node: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  label: { marginTop: spacing.xs },
});

/** Small helper so screens don't repeat the tint math. */
export const stepFill = (c: string) => withAlpha(c, 0.12);
