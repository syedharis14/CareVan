import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { DriverStackParamList } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme/theme';
import { Button, Card, Header, Screen, Text } from '../../ui';
import { batterySteps, getOemName, openBatterySettings, setBatteryAck } from '../../utils/battery';

type Nav = NativeStackNavigationProp<DriverStackParamList, 'BatteryWhitelist'>;

export function BatteryWhitelistScreen() {
  const navigation = useNavigation<Nav>();
  const steps = batterySteps();

  const confirmDone = async () => {
    await setBatteryAck(true);
    navigation.goBack();
  };

  return (
    <Screen
      scroll
      header={<Header onBack={() => navigation.goBack()} title="Background permission" />}
    >
      <Text variant="h1">Keep CareVan running</Text>
      <Text variant="body" color={colors.inkSoft} style={styles.intro}>
        {getOemName()} phones can stop apps in the background to save battery. If that happens
        mid-trip, parents stop getting alerts. CareVan only tracks during an active trip.
      </Text>

      <Card>
        {steps.map((step, i) => (
          <View key={i} style={[styles.step, i > 0 && styles.divider]}>
            <View style={styles.badge}>
              <Text variant="label" color={colors.surface}>
                {i + 1}
              </Text>
            </View>
            <Text variant="body" style={styles.stepText}>
              {step}
            </Text>
          </View>
        ))}
      </Card>

      <Button
        label="Open phone settings"
        variant="secondary"
        icon="settings-outline"
        onPress={openBatterySettings}
        style={styles.mt}
      />
      <Button
        label="I've enabled it"
        variant="safe"
        icon="checkmark-circle"
        onPress={confirmDone}
        style={styles.mt}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.sm, marginBottom: spacing.xl },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  mt: { marginTop: spacing.lg },
});
