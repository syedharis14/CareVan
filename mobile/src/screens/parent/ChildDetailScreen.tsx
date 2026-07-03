import { useCallback, useEffect, useRef, useState } from 'react';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Constants from 'expo-constants';
import { DriverCard } from '../../components/DriverCard';
import { SafetyStrip } from '../../components/SafetyStrip';
import { ParentStackParamList } from '../../navigation/types';
import { useParentStore } from '../../store/parentStore';
import { colors, elevation, radii, spacing, withAlpha } from '../../theme/theme';
import { Avatar, Header, Icon, IconName, Screen, Stepper, Text } from '../../ui';
import { journey, statusView } from '../../utils/childStatus';
import { distanceMeters, etaMinutes } from '../../utils/geo';
import { fetchRoute, RoutePoint } from '../../utils/directions';

type Route = RouteProp<ParentStackParamList, 'ChildDetail'>;
type Nav = NativeStackNavigationProp<ParentStackParamList, 'ChildDetail'>;
type LatLng = { lat: number; lng: number };
const POLL_MS = 12_000;
/** Refetch the road route only after the van has moved this far (keeps Directions calls low). */
const ROUTE_REFETCH_M = 150;
const MAPS_KEY: string =
  (Constants.expoConfig?.extra?.googleMapsApiKey as string | undefined) ?? '';

/**
 * Frame the map so both the van and its destination are comfortably visible (ride-hailing
 * style). When they're very close, fitting would over-zoom, so we center between them instead.
 */
function frameMap(map: MapView | null, van: LatLng, dst: LatLng) {
  if (!map) return;
  const d = distanceMeters(van.lat, van.lng, dst.lat, dst.lng);
  if (d < 250) {
    map.animateToRegion(
      {
        latitude: (van.lat + dst.lat) / 2,
        longitude: (van.lng + dst.lng) / 2,
        latitudeDelta: 0.006,
        longitudeDelta: 0.006,
      },
      450,
    );
  } else {
    map.fitToCoordinates(
      [
        { latitude: van.lat, longitude: van.lng },
        { latitude: dst.lat, longitude: dst.lng },
      ],
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true },
    );
  }
}

/** Round, floating map control (back / recenter). */
function MapButton({
  icon,
  onPress,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={colors.ink} />
    </Pressable>
  );
}

/** The moving van, as a colored badge with a soft halo. Halo is laid out (not absolute) so
 * the Android marker snapshot captures the icon without clipping. */
function VanMarker({ color }: { color: string }) {
  return (
    <View style={[styles.vanHalo, { backgroundColor: withAlpha(color, 0.18) }]}>
      <View style={[styles.vanBadge, { backgroundColor: color }]}>
        <Icon name="bus" size={20} color={colors.surface} />
      </View>
    </View>
  );
}

/** Destination pin (school or home). */
function DestMarker({ icon }: { icon: IconName }) {
  return (
    <View style={styles.destBadge}>
      <Icon name={icon} size={16} color={colors.surface} />
    </View>
  );
}

export function ChildDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const refresh = useParentStore((s) => s.refresh);
  const child = useParentStore((s) => s.children.find((c) => c.student.id === params.studentId));
  const mapRef = useRef<MapView>(null);
  const lastFramed = useRef<LatLng | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => void refresh(), POLL_MS);
      return () => clearInterval(id);
    }, [refresh]),
  );

  const ping = child?.activeTrip?.lastPing ?? null;
  const status = child?.status;
  const view = status ? statusView(status) : null;
  // Before boarding on a PICKUP trip the van heads to HOME (to collect the child); after
  // boarding it heads to SCHOOL. DROPOFF always heads home.
  const goingToSchool = child?.activeTrip?.type === 'PICKUP' && child?.status !== 'WAITING';
  const destLat = child ? (goingToSchool ? child.school.lat : child.home.lat) : null;
  const destLng = child ? (goingToSchool ? child.school.lng : child.home.lng) : null;

  // Re-frame the map when the van has moved enough to matter (keeps both van + destination visible).
  useEffect(() => {
    if (!ping || destLat == null || destLng == null) return;
    const prev = lastFramed.current;
    if (prev && distanceMeters(prev.lat, prev.lng, ping.lat, ping.lng) <= 60) return;
    lastFramed.current = { lat: ping.lat, lng: ping.lng };
    frameMap(mapRef.current, { lat: ping.lat, lng: ping.lng }, { lat: destLat, lng: destLng });
  }, [ping, destLat, destLng]);

  // Re-render the marker bitmap on mount / status-color change, then freeze it for battery.
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 2000);
    return () => clearTimeout(t);
  }, [view?.color]);

  // Road-following route (Google Directions). Refetched only after meaningful van movement;
  // falls back to a straight line whenever the request fails, so the map never breaks.
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const lastRouteFrom = useRef<LatLng | null>(null);
  useEffect(() => {
    if (!ping || destLat == null || destLng == null) return;
    const from = lastRouteFrom.current;
    if (from && distanceMeters(from.lat, from.lng, ping.lat, ping.lng) < ROUTE_REFETCH_M) return;
    lastRouteFrom.current = { lat: ping.lat, lng: ping.lng };
    let cancelled = false;
    void fetchRoute(
      { lat: ping.lat, lng: ping.lng },
      { lat: destLat, lng: destLng },
      MAPS_KEY,
    ).then((coords) => {
      if (!cancelled && coords) setRoute(coords);
    });
    return () => {
      cancelled = true;
    };
  }, [ping, destLat, destLng]);

  if (!child || !view) {
    return (
      <Screen header={<Header onBack={() => navigation.goBack()} title="Live" />}>
        <Text variant="body" color={colors.inkSoft} center>
          Loading…
        </Text>
      </Screen>
    );
  }

  const trip = child.activeTrip;
  const { steps, current } = journey(child.status, trip?.type);
  const destination = goingToSchool
    ? { lat: child.school.lat, lng: child.school.lng, label: child.school.name }
    : { lat: child.home.lat, lng: child.home.lng, label: 'home' };
  const destIcon: IconName = goingToSchool ? 'school' : 'home';
  const eta =
    ping && trip
      ? etaMinutes(ping.lat, ping.lng, destination.lat, destination.lng, ping.speedKmh)
      : null;

  const recenter = () => {
    if (!ping) return;
    lastFramed.current = { lat: ping.lat, lng: ping.lng };
    frameMap(mapRef.current, { lat: ping.lat, lng: ping.lng }, destination);
  };

  const callDriver = () => {
    if (!child.van) return;
    void Linking.openURL(`tel:${child.van.driverPhone}`).catch(() =>
      Alert.alert('Cannot place call', `Dial ${child.van?.driverPhone} manually.`),
    );
  };

  // ---- LIVE TRIP: map-dominant ride-hailing layout -------------------------------------------
  if (trip && ping) {
    const vanTag = child.van ? ` · Van ${child.van.plateNo}` : '';
    const enrouteEta = view.enRoute && eta != null; // on the van, en route to destination
    const approaching = child.status === 'WAITING' && eta != null; // van coming to pick up
    let headline: string;
    let subline: string;
    if (enrouteEta) {
      headline = `Arriving in ~${eta} min`;
      subline = `${view.label}${vanTag}`;
    } else if (approaching) {
      headline = `Driver ~${eta} min away`;
      subline = `Coming to pick up${vanTag}`;
    } else {
      headline = view.label;
      subline = child.van ? `Van ${child.van.plateNo}` : 'On a trip';
    }

    return (
      <View style={styles.root}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: ping.lat,
            longitude: ping.lng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          mapPadding={{ top: insets.top + 56, right: 0, bottom: 290, left: 0 }}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {route.length > 1 ? (
            <Polyline
              coordinates={route}
              strokeColor={withAlpha(colors.primary, 0.9)}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          ) : (
            <Polyline
              coordinates={[
                { latitude: ping.lat, longitude: ping.lng },
                { latitude: destination.lat, longitude: destination.lng },
              ]}
              strokeColor={withAlpha(colors.primary, 0.45)}
              strokeWidth={4}
              lineDashPattern={[2, 8]}
            />
          )}
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracks}
            zIndex={1}
            title={destination.label}
          >
            <DestMarker icon={destIcon} />
          </Marker>
          <Marker
            coordinate={{ latitude: ping.lat, longitude: ping.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={tracks}
            zIndex={2}
            title={child.van ? `Van ${child.van.plateNo}` : 'Van'}
          >
            <VanMarker color={view.color} />
          </Marker>
        </MapView>

        {/* Floating controls over the map */}
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <MapButton icon="chevron-back" label="Go back" onPress={() => navigation.goBack()} />
          <View style={styles.namePill}>
            <Text variant="label" numberOfLines={1}>
              {child.student.name}
            </Text>
          </View>
          <MapButton icon="locate" label="Recenter on van" onPress={recenter} />
        </View>

        {child.sosActive ? (
          <View style={[styles.sosFloat, { top: insets.top + 60 }]}>
            <Icon name="warning" size={16} color={colors.surface} />
            <Text variant="label" color={colors.surface} style={styles.flex}>
              Emergency — the driver raised an SOS. Call now.
            </Text>
          </View>
        ) : null}

        {/* Floating detail sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />

          <View style={styles.sheetHead}>
            <View style={[styles.statusIcon, { backgroundColor: withAlpha(view.color, 0.14) }]}>
              <Icon name={view.icon} size={24} color={view.color} />
            </View>
            <View style={styles.flex}>
              <Text variant="h2" color={view.color} numberOfLines={2}>
                {headline}
              </Text>
              <Text variant="body" color={colors.inkSoft} numberOfLines={2}>
                {subline}
              </Text>
            </View>
          </View>

          <View style={styles.stepperWrap}>
            <Stepper steps={steps} current={current} accent={view.color} />
          </View>

          {child.van ? (
            <>
              <View style={styles.divider} />
              <View style={styles.driverRow}>
                <Avatar name={child.van.driverName} color={colors.primary} size={44} />
                <View style={styles.flex}>
                  <Text variant="bodyMd" numberOfLines={1}>
                    {child.van.driverName}
                  </Text>
                  <Text variant="caption" color={colors.inkSoft}>
                    Van {child.van.plateNo} · Driver
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${child.van.driverName}`}
                  onPress={callDriver}
                  style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
                >
                  <Icon name="call" size={20} color={colors.surface} />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </View>
    );
  }

  // ---- NO ACTIVE TRIP: calm status view ------------------------------------------------------
  return (
    <Screen scroll header={<Header onBack={() => navigation.goBack()} title={child.student.name} />}>
      {child.sosActive ? (
        <View style={styles.sosBanner}>
          <Icon name="warning" size={18} color={colors.surface} />
          <Text variant="bodyMd" color={colors.surface} style={styles.flex}>
            Emergency — the driver raised an SOS. Please call now.
          </Text>
        </View>
      ) : null}

      <View style={styles.restCard}>
        <View style={[styles.restIcon, { backgroundColor: withAlpha(view.color, 0.14) }]}>
          <Icon name={view.icon} size={30} color={view.color} />
        </View>
        <Text variant="h2" color={view.color} center>
          {view.label}
        </Text>
        <Text variant="body" color={colors.inkSoft} center style={styles.restText}>
          The van isn&apos;t on a trip right now. You&apos;ll get a push the moment{' '}
          {child.student.name.split(' ')[0]} boards.
        </Text>
        <View style={styles.restStepper}>
          <Stepper steps={steps} current={current} accent={view.color} />
        </View>
      </View>

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
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },

  // Floating map controls
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.md,
  },
  namePill: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    ...elevation.md,
  },
  sosFloat: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...elevation.md,
  },

  // Map markers
  vanHalo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vanBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  destBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    ...elevation.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperWrap: { marginTop: spacing.xl },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },

  // Idle (no-trip) view
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  restCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    ...elevation.md,
  },
  restIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  restText: { maxWidth: 300 },
  restStepper: { alignSelf: 'stretch', marginTop: spacing.lg },
  gap: { marginBottom: spacing.lg },
});
