import { colors } from '@carevan/shared';
import * as Crypto from 'expo-crypto';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { KV_ACTIVE_TRIP_ID, kvGet, kvSet } from '../db/database';
import { enqueuePing } from '../db/outbox';
import { PING_DISTANCE_M, PING_INTERVAL_MS } from '../config';
import { syncPingsNow } from '../sync/syncEngine';

export const LOCATION_TASK = 'carevan-location-task';

const KV_LAST_PING_FLUSH = 'last_ping_flush_at';
/** Battery/data: batch ping uploads to ~30s even in the background, rather than
 *  hitting the network on every location fix (~12s). Balances the ~30–60s target
 *  against REACHED-alert timeliness. */
const PING_FLUSH_MIN_INTERVAL_MS = 30_000;

interface LocationTaskData {
  locations: Location.LocationObject[];
}

/**
 * Registered at module load (see index.ts) so a background-launched process can
 * handle location events. Each fix is written to the SQLite outbox BEFORE any
 * upload, then an opportunistic ping flush runs. The task is a no-op if there is
 * no active trip (defensive — tracking is stopped on trip end).
 */
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = (data ?? { locations: [] }) as LocationTaskData;
  if (locations.length === 0) return;

  const tripId = await kvGet(KV_ACTIVE_TRIP_ID);
  if (!tripId) return;

  for (const loc of locations) {
    const speed = loc.coords.speed;
    const speedKmh = speed && speed > 0 ? Math.min(speed * 3.6, 300) : 0;
    await enqueuePing({
      id: Crypto.randomUUID(),
      tripId,
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      speedKmh,
      at: new Date(loc.timestamp),
    });
  }

  // Throttled batch upload — the pings are already durable in the outbox, so
  // waiting to the ~30s mark costs nothing but battery/data savings.
  const lastStr = await kvGet(KV_LAST_PING_FLUSH);
  const last = lastStr ? Number(lastStr) : 0;
  if (Date.now() - last >= PING_FLUSH_MIN_INTERVAL_MS) {
    await kvSet(KV_LAST_PING_FLUSH, String(Date.now()));
    await syncPingsNow();
  }
});

/** Request foreground + background location. Returns false if the driver declines. */
export async function ensureLocationPermission(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.status === 'granted';
}

/** Begin foreground-service tracking for a trip. Idempotent. */
export async function startTracking(tripId: string): Promise<void> {
  await kvSet(KV_ACTIVE_TRIP_ID, tripId);
  const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (already) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    timeInterval: PING_INTERVAL_MS,
    distanceInterval: PING_DISTANCE_M,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.AutomotiveNavigation,
    foregroundService: {
      notificationTitle: 'CareVan trip in progress',
      notificationBody: 'Sharing the van location so parents get alerts.',
      notificationColor: colors.primary,
    },
  });
}

/** Stop tracking and clear the active-trip marker. Safe to call when not tracking. */
export async function stopTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (started) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => undefined);
  }
  await kvSet(KV_ACTIVE_TRIP_ID, null);
  await kvSet(KV_LAST_PING_FLUSH, null);
}
