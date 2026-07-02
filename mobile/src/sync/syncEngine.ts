import { PingInput, TripEventInput, TripEventType } from '@carevan/shared';
import { driverApi } from '../api/endpoints';
import { markEventsSynced, markPingsSynced, unsyncedEvents, unsyncedPings } from '../db/outbox';

/**
 * Drains the SQLite outbox to the server in batches. Idempotent by construction:
 * the server dedupes on the client UUID, so a failed flush simply retries next tick
 * — nothing is ever lost, nothing is double-counted. Never throws to callers.
 */
let running = false;

function groupByTrip<T extends { tripId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const group = map.get(row.tripId) ?? [];
    group.push(row);
    map.set(row.tripId, group);
  }
  return map;
}

async function flushEvents(): Promise<void> {
  const rows = await unsyncedEvents(50);
  if (rows.length === 0) return;
  for (const [tripId, group] of groupByTrip(rows)) {
    const events: TripEventInput[] = group.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      type: r.type as TripEventType,
      at: new Date(r.at),
      lat: r.lat ?? undefined,
      lng: r.lng ?? undefined,
    }));
    try {
      await driverApi.postEvents(tripId, { events });
      // accepted / duplicate / rejected are all terminal — the server has handled them.
      await markEventsSynced(group.map((r) => r.id));
    } catch {
      // Leave unsynced; the next tick retries.
    }
  }
}

async function flushPings(): Promise<void> {
  const rows = await unsyncedPings(300);
  if (rows.length === 0) return;
  for (const [tripId, group] of groupByTrip(rows)) {
    const pings: PingInput[] = group.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      speedKmh: r.speedKmh,
      at: new Date(r.at),
    }));
    try {
      await driverApi.postPings(tripId, { pings });
      await markPingsSynced(group.map((r) => r.id));
    } catch {
      // Leave unsynced; the next tick retries.
    }
  }
}

/** Flush the whole outbox once. Safe to call frequently; self-coalescing. */
export async function syncNow(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await flushEvents();
    await flushPings();
  } finally {
    running = false;
  }
}

/** Ping-only flush — used by the background location task after enqueuing. */
export async function syncPingsNow(): Promise<void> {
  await flushPings().catch(() => undefined);
}
