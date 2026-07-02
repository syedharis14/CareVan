import { PingInput, TripEventInput, TripEventType } from '@carevan/shared';
import { driverApi } from '../api/endpoints';
import { markEventsSynced, markPingsSynced, unsyncedEvents, unsyncedPings } from '../db/outbox';

/**
 * Drains the SQLite outbox to the server in batches. Idempotent by construction:
 * the server dedupes on the client UUID, so a failed flush simply retries next tick
 * — nothing is ever lost, nothing is double-counted. Never throws to callers.
 *
 * On repeated network failure it backs off exponentially (30s → … → 5min) so a
 * persistently-unreachable server isn't hammered every tick; a success resets it.
 */
let running = false;
let failureStreak = 0;
let nextAttemptAt = 0;
const BACKOFF_BASE_MS = 30_000;
const BACKOFF_MAX_MS = 5 * 60_000;

function groupByTrip<T extends { tripId: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const group = map.get(row.tripId) ?? [];
    group.push(row);
    map.set(row.tripId, group);
  }
  return map;
}

/** Returns true if a network/server error occurred (so the caller can back off). */
async function flushEvents(): Promise<boolean> {
  const rows = await unsyncedEvents(50);
  if (rows.length === 0) return false;
  let hadError = false;
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
      const res = await driverApi.postEvents(tripId, { events });
      // accepted / duplicate / rejected are all terminal — the server has handled them.
      await markEventsSynced(group.map((r) => r.id));
      // A hard reject (e.g. STUDENT_NOT_ON_VAN) won't succeed on retry, but a dropped
      // safety event must be visible rather than silently swallowed.
      if (res.rejected.length > 0) {
        console.warn('[sync] server rejected events', res.rejected);
      }
    } catch {
      hadError = true; // leave unsynced; retried next tick
    }
  }
  return hadError;
}

async function flushPings(): Promise<boolean> {
  const rows = await unsyncedPings(300);
  if (rows.length === 0) return false;
  let hadError = false;
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
      hadError = true;
    }
  }
  return hadError;
}

/** Flush the whole outbox once. Safe to call frequently; self-coalescing + backoff. */
export async function syncNow(): Promise<void> {
  if (running || Date.now() < nextAttemptAt) return;
  running = true;
  try {
    const eventsErr = await flushEvents();
    const pingsErr = await flushPings();
    if (eventsErr || pingsErr) {
      failureStreak += 1;
      const delay = Math.min(BACKOFF_BASE_MS * 2 ** (failureStreak - 1), BACKOFF_MAX_MS);
      nextAttemptAt = Date.now() + delay;
    } else {
      failureStreak = 0;
      nextAttemptAt = 0;
    }
  } finally {
    running = false;
  }
}

/** Ping-only flush — used by the background location task after enqueuing. */
export async function syncPingsNow(): Promise<void> {
  await flushPings().catch(() => undefined);
}
