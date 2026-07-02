import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';
import { TripType } from '@carevan/shared';
import { ensureLocationPermission } from '../../location/locationTask';
import { DriverStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { colors, radii, spacing, withAlpha } from '../../theme/theme';
import { Button, Card, Icon, Logo, Screen, Text } from '../../ui';
import { getBatteryAck, isAggressiveOem } from '../../utils/battery';

type Nav = NativeStackNavigationProp<DriverStackParamList>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { ready, vanId, schoolName, students, trip, busy, error, bootstrap, startTrip } =
    useTripStore();
  const [needsBattery, setNeedsBattery] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void bootstrap();
      void (async () => setNeedsBattery(isAggressiveOem() && !(await getBatteryAck())))();
    }, [bootstrap]),
  );

  const begin = async (type: TripType) => {
    const ok = await ensureLocationPermission();
    if (!ok) {
      Alert.alert(
        'Location needed',
        'CareVan needs "Allow all the time" location to track the van during a trip. Enable it in Settings.',
      );
      return;
    }
    try {
      await startTrip(type);
      navigation.navigate('ActiveTrip');
    } catch (e) {
      Alert.alert('Could not start trip', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Driver';

  const header = (
    <View style={styles.header}>
      <View style={styles.flex}>
        <Text variant="caption" color={colors.inkSoft}>
          {greeting()}
        </Text>
        <Text variant="h1" numberOfLines={1}>
          {firstName}
        </Text>
      </View>
      <Logo size={38} wordmark={false} />
    </View>
  );

  return (
    <Screen scroll header={header}>
      {needsBattery ? (
        <Card
          onPress={() => navigation.navigate('BatteryWhitelist')}
          style={styles.banner}
          variant="flat"
        >
          <View style={styles.bannerRow}>
            <View style={styles.bannerIcon}>
              <Icon name="battery-charging" size={20} color={colors.transit} />
            </View>
            <View style={styles.flex}>
              <Text variant="bodyMd">Keep alerts working</Text>
              <Text variant="caption" color={colors.inkSoft}>
                Allow CareVan to run in the background
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.inkSoft} />
          </View>
        </Card>
      ) : null}

      {!ready ? (
        <Text variant="body" color={colors.inkSoft}>
          Loading your van…
        </Text>
      ) : !vanId ? (
        <Card>
          <Text variant="title">No van assigned yet</Text>
          <Text variant="body" color={colors.inkSoft} style={styles.mt}>
            CareVan hasn&apos;t linked a van to your account. Please contact the office.
          </Text>
        </Card>
      ) : (
        <>
          <Card>
            <View style={styles.vanRow}>
              <View style={styles.vanIcon}>
                <Icon name="bus" size={24} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text variant="title">{schoolName}</Text>
                <Text variant="caption" color={colors.inkSoft}>
                  {students.length} students on your route
                </Text>
              </View>
            </View>
          </Card>

          {error ? (
            <Text variant="caption" color={colors.ink} style={styles.mt}>
              {error}
            </Text>
          ) : null}

          {trip ? (
            <Button
              label="Resume active trip"
              variant="safe"
              icon="navigate"
              onPress={() => navigation.navigate('ActiveTrip')}
              style={styles.action}
            />
          ) : (
            <>
              <Text variant="label" color={colors.inkSoft} style={styles.section}>
                START A TRIP
              </Text>
              <Button
                label="Morning pickup"
                icon="sunny"
                onPress={() => begin('PICKUP')}
                loading={busy}
              />
              <Button
                label="Afternoon dropoff"
                variant="secondary"
                icon="home"
                onPress={() => begin('DROPOFF')}
                loading={busy}
                style={styles.action}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  flex: { flex: 1 },
  mt: { marginTop: spacing.sm },
  banner: { marginBottom: spacing.lg, borderColor: colors.transit },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: withAlpha(colors.transit, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vanRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vanIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: withAlpha(colors.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm, letterSpacing: 0.5 },
  action: { marginTop: spacing.md },
});
