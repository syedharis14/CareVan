import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TripType } from '@carevan/shared';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ensureLocationPermission } from '../../location/locationTask';
import { DriverStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useTripStore } from '../../store/tripStore';
import { theme } from '../../theme/theme';
import { getBatteryAck, isAggressiveOem } from '../../utils/battery';

type Nav = NativeStackNavigationProp<DriverStackParamList, 'Today'>;

export function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hi}>Assalam-o-Alaikum</Text>
          <Text style={styles.name}>{user?.name ?? 'Driver'}</Text>
        </View>
        <Pressable onPress={logout} accessibilityRole="button">
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {needsBattery ? (
        <Pressable
          style={styles.banner}
          onPress={() => navigation.navigate('BatteryWhitelist')}
          accessibilityRole="button"
        >
          <Text style={styles.bannerTitle}>⚠ Action needed to keep alerts working</Text>
          <Text style={styles.bannerText}>
            Tap to allow CareVan to run in the background on your phone.
          </Text>
        </Pressable>
      ) : null}

      {!ready ? (
        <Text style={styles.muted}>Loading your van…</Text>
      ) : !vanId ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No van assigned yet</Text>
          <Text style={styles.muted}>
            CareVan hasn&apos;t linked a van to your account. Please contact the office.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{schoolName}</Text>
            <Text style={styles.muted}>{students.length} students on your route</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {trip ? (
            <PrimaryButton
              label="Resume active trip"
              variant="safe"
              onPress={() => navigation.navigate('ActiveTrip')}
              style={styles.action}
            />
          ) : (
            <>
              <Text style={styles.sectionLabel}>Start a trip</Text>
              <PrimaryButton
                label="Start morning pickup"
                onPress={() => begin('PICKUP')}
                loading={busy}
                style={styles.action}
              />
              <PrimaryButton
                label="Start afternoon dropoff"
                variant="ghost"
                onPress={() => begin('DROPOFF')}
                loading={busy}
                style={styles.action}
              />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  hi: { fontSize: 15, color: theme.colors.inkSoft },
  name: { fontSize: 26, fontWeight: '800', color: theme.colors.ink },
  logout: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  banner: {
    backgroundColor: theme.withAlpha(theme.colors.transit, 0.15),
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.transit,
  },
  bannerTitle: { fontWeight: '700', color: theme.colors.ink, fontSize: 15 },
  bannerText: { color: theme.colors.inkSoft, marginTop: 2, fontSize: 14 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.cardShadow,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.ink },
  muted: { color: theme.colors.inkSoft, fontSize: 15, marginTop: 2 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.inkSoft,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  action: { marginTop: theme.spacing.md },
  error: { color: theme.colors.danger, marginBottom: theme.spacing.md },
});
