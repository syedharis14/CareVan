import { PingInput, TripEventInput } from '@carevan/shared';
import { getDb } from './database';

/** An event as stored locally — includes the tripId it belongs to. */
export interface OutboxEvent extends TripEventInput {
  tripId: string;
}
export interface OutboxPing extends PingInput {
  tripId: string;
}

// --- Writes happen BEFORE any network call ---

export async function enqueueEvent(event: OutboxEvent): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO outbox_event (id, tripId, studentId, type, at, lat, lng, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    event.id,
    event.tripId,
    event.studentId,
    event.type,
    event.at.toISOString(),
    event.lat ?? null,
    event.lng ?? null,
  );
}

export async function enqueuePing(ping: OutboxPing): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO outbox_ping (id, tripId, lat, lng, speedKmh, at, synced)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    ping.id,
    ping.tripId,
    ping.lat,
    ping.lng,
    ping.speedKmh,
    ping.at.toISOString(),
  );
}

// --- Reads for the sync engine ---

interface EventRow {
  id: string;
  tripId: string;
  studentId: string;
  type: string;
  at: string;
  lat: number | null;
  lng: number | null;
}
interface PingRow {
  id: string;
  tripId: string;
  lat: number;
  lng: number;
  speedKmh: number;
  at: string;
}

export async function unsyncedEvents(limit = 50): Promise<EventRow[]> {
  const db = await getDb();
  return db.getAllAsync<EventRow>(
    'SELECT * FROM outbox_event WHERE synced = 0 ORDER BY at ASC LIMIT ?',
    limit,
  );
}

export async function unsyncedPings(limit = 300): Promise<PingRow[]> {
  const db = await getDb();
  return db.getAllAsync<PingRow>(
    'SELECT * FROM outbox_ping WHERE synced = 0 ORDER BY at ASC LIMIT ?',
    limit,
  );
}

/** Unsynced local events for a trip — overlaid on server state so taps show instantly. */
export async function unsyncedEventsForTrip(tripId: string): Promise<EventRow[]> {
  const db = await getDb();
  return db.getAllAsync<EventRow>(
    'SELECT * FROM outbox_event WHERE tripId = ? AND synced = 0 ORDER BY at ASC',
    tripId,
  );
}

export async function markEventsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE outbox_event SET synced = 1 WHERE id IN (${placeholders})`, ...ids);
}

export async function markPingsSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE outbox_ping SET synced = 1 WHERE id IN (${placeholders})`, ...ids);
}

export async function pendingCounts(): Promise<{ events: number; pings: number }> {
  const db = await getDb();
  const e = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM outbox_event WHERE synced = 0',
  );
  const p = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM outbox_ping WHERE synced = 0',
  );
  return { events: e?.n ?? 0, pings: p?.n ?? 0 };
}
