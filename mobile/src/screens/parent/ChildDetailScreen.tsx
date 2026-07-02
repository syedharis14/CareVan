import { useCallback, useEffect, useRef } from 'react';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { distanceMeters } from '../../utils/geo';
import { DriverCard } from '../../components/DriverCard';
import { SafetyStrip } from '../../components/SafetyStrip';
import { ParentStackParamList } from '../../navigation/types';
import { useParentStore } from '../../store/parentStore';
import { theme } from '../../theme/theme';
import { statusView } from '../../utils/childStatus';
import { etaMinutes } from '../../utils/geo';

type Route = RouteProp<ParentStackParamList, 'ChildDetail'>;
const POLL_MS = 12_000;

export function ChildDetailScreen() {
  const { params } = useRoute<Route>();
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

  // Recenter the map only when the van has moved materially (>75m) — so the parent's
  // own pan/zoom isn't yanked back on every 12s poll (map uses initialRegion, not a
  // controlled region prop).
  useEffect(() => {
    if (!ping) return;
    const prev = lastCentered.current;
    if (!prev || distanceMeters(prev.lat, prev.lng, ping.lat, ping.lng) > 75) {
      lastCentered.current = { lat: ping.lat, lng: ping.lng };
      mapRef.current?.animateToRegion(
        { latitude: ping.lat, longitude: ping.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        600,
      );
    }
  }, [ping]);

  if (!child) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const view = statusView(child.status);
  const trip = child.activeTrip;
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
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {child.sosActive ? (
        <View style={styles.sos}>
          <Text style={styles.sosText}>🚨 EMERGENCY — driver raised an SOS. Please call now.</Text>
        </View>
      ) : null}

      <View style={[styles.statusHeader, { backgroundColor: theme.withAlpha(view.color, 0.12) }]}>
        <Text style={styles.name}>{child.student.name}</Text>
        <Text style={[styles.status, { color: view.color }]}>
          {view.icon} {view.label}
        </Text>
        {view.enRoute && eta != null ? (
          <Text style={styles.eta}>
            ~{eta} min to {destination.label}
          </Text>
        ) : null}
      </View>

      {trip && ping ? (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={initialRegion}
          >
            <Marker
              coordinate={{ latitude: ping.lat, longitude: ping.lng }}
              title={child.van ? `Van ${child.van.plateNo}` : 'Van'}
              description="Current location"
              pinColor={theme.colors.transit}
            />
            <Marker
              coordinate={{ latitude: destination.lat, longitude: destination.lng }}
              title={destination.label}
              pinColor={theme.colors.primary}
            />
          </MapView>
        </View>
      ) : (
        <View style={styles.noTrip}>
          <Text style={styles.muted}>
            The van isn&apos;t on a trip right now. You&apos;ll get a push when {child.student.name}{' '}
            boards.
          </Text>
        </View>
      )}

      <SafetyStrip overspeedCount={child.todayOverspeedCount} />

      {child.van ? (
        <DriverCard
          plateNo={child.van.plateNo}
          driverName={child.van.driverName}
          driverPhone={child.van.driverPhone}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.inkSoft, fontSize: 15, textAlign: 'center' },
  statusHeader: { borderRadius: theme.radii.card, padding: theme.spacing.xl },
  name: { fontSize: 24, fontWeight: '800', color: theme.colors.ink },
  status: { fontSize: 20, fontWeight: '700', marginTop: theme.spacing.sm },
  eta: { fontSize: 16, color: theme.colors.ink, marginTop: theme.spacing.xs },
  mapWrap: {
    height: 280,
    borderRadius: theme.radii.card,
    overflow: 'hidden',
    marginTop: theme.spacing.lg,
    ...theme.cardShadow,
  },
  map: { flex: 1 },
  noTrip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.card,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    ...theme.cardShadow,
  },
  sos: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  sosText: { color: theme.colors.surface, fontWeight: '700', textAlign: 'center' },
});
