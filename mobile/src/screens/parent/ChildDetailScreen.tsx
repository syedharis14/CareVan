import { useCallback, useEffect, useRef } from 'react';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { DriverCard } from '../../components/DriverCard';
import { SafetyStrip } from '../../components/SafetyStrip';
import { ParentStackParamList } from '../../navigation/types';
import { useParentStore } from '../../store/parentStore';
import { colors, radii, spacing, withAlpha } from '../../theme/theme';
import { Card, Header, Icon, Screen, Stepper, Text } from '../../ui';
import { journey, statusView } from '../../utils/childStatus';
import { distanceMeters, etaMinutes } from '../../utils/geo';

type Route = RouteProp<ParentStackParamList, 'ChildDetail'>;
type Nav = NativeStackNavigationProp<ParentStackParamList, 'ChildDetail'>;
const POLL_MS = 12_000;

export function ChildDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const refresh = useParentStore((s) => s.refresh);
  const child = useParentStore((s) => s.children.find((c) => c.student.id === params.studentId));
  const mapRef = useRef<MapView>(null);
  const lastCentered = useRef<{ lat: number; lng: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => void refresh(), POLL_MS);
      return () => clearInterval(id);
    }, [refresh]),
  );

  const ping = child?.activeTrip?.lastPing ?? null;

  useEffect(() => {
    if (!ping) return;
    const prev = lastCentered.current;
    if (!prev || distanceMeters(prev.lat, prev.lng, ping.lat, ping.lng) > 75) {
      lastCentered.current = { lat: ping.lat, lng: ping.lng };
      mapRef.current?.animateToRegion(
        { latitude: ping.lat, longitude: ping.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        600,
      );
    }
  }, [ping]);

  if (!child) {
    return (
      <Screen header={<Header onBack={() => navigation.goBack()} title="Live" />}>
        <Text variant="body" color={colors.inkSoft} center>
          Loading…
        </Text>
      </Screen>
    );
  }

  const view = statusView(child.status);
  const trip = child.activeTrip;
  const { steps, current } = journey(child.status, trip?.type);
  const destination =
    trip?.type === 'PICKUP'
      ? { ...child.school, label: child.school.name }
      : { lat: child.home.lat, lng: child.home.lng, label: 'Home' };
  const eta =
    ping && trip
      ? etaMinutes(ping.lat, ping.lng, destination.lat, destination.lng, ping.speedKmh)
      : null;
  const initialRegion = {
    latitude: ping?.lat ?? child.school.lat,
    longitude: ping?.lng ?? child.school.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <Screen
      scroll
      header={<Header onBack={() => navigation.goBack()} title={child.student.name} />}
    >
      {child.sosActive ? (
        <View style={styles.sos}>
          <Icon name="warning" size={18} color={colors.surface} />
          <Text variant="bodyMd" color={colors.surface} style={styles.flex}>
            Emergency — the driver raised an SOS. Please call now.
          </Text>
        </View>
      ) : null}

      <Card padded={false} style={styles.hero}>
        <View style={[styles.heroTop, { backgroundColor: withAlpha(view.color, 0.1) }]}>
          <View style={[styles.heroIcon, { backgroundColor: withAlpha(view.color, 0.16) }]}>
            <Icon name={view.icon} size={26} color={view.color} />
          </View>
          <View style={styles.flex}>
            <Text variant="h2" color={view.color}>
              {view.label}
            </Text>
            {view.enRoute && eta != null ? (
              <Text variant="body" color={colors.inkSoft}>
                ~{eta} min to {destination.label}
              </Text>
            ) : (
              <Text variant="body" color={colors.inkSoft}>
                {child.van ? `Van ${child.van.plateNo}` : 'No van assigned'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.heroStepper}>
          <Stepper steps={steps} current={current} accent={view.color} />
        </View>
      </Card>

      {trip && ping ? (
        <Card padded={false} style={styles.mapCard}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={initialRegion}
          >
            <Marker
              coordinate={{ latitude: ping.lat, longitude: ping.lng }}
              title={child.van ? `Van ${child.van.plateNo}` : 'Van'}
              pinColor={colors.transit}
            />
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title={destination.label}
              pinColor={colors.primary}
            />
          </MapView>
        </Card>
      ) : (
        <Card style={styles.noTrip}>
          <Icon name="bus-outline" size={26} color={colors.inkSoft} />
          <Text variant="body" color={colors.inkSoft} center style={styles.noTripText}>
            The van isn&apos;t on a trip right now. You&apos;ll get a push when {child.student.name}{' '}
            boards.
          </Text>
        </Card>
      )}

      <View style={styles.gap}>
        <SafetyStrip overspeedCount={child.todayOverspeedCount} />
      </View>

      {child.van ? (
        <DriverCard
          plateNo={child.van.plateNo}
          driverName={child.van.driverName}
          driverPhone={child.van.driverPhone}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  hero: { overflow: 'hidden', marginBottom: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStepper: { padding: spacing.lg },
  mapCard: { height: 260, overflow: 'hidden', marginBottom: spacing.lg },
  map: { flex: 1 },
  noTrip: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  noTripText: { maxWidth: 280 },
  gap: { marginBottom: spacing.lg },
});
