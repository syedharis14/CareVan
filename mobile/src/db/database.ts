import * as SQLite from 'expo-sqlite';

/**
 * The offline-first spine: a persistent SQLite outbox. Every trip event and location
 * ping is written here BEFORE any network call and survives app kill. A sync engine
 * drains it; the server dedupes on the client-generated UUID, so retries are safe.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('carevan.db').then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS outbox_event (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          studentId TEXT NOT NULL,
          type TEXT NOT NULL,
          at TEXT NOT NULL,
          lat REAL,
          lng REAL,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS outbox_ping (
          id TEXT PRIMARY KEY NOT NULL,
          tripId TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          speedKmh REAL NOT NULL,
          at TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_event_unsynced ON outbox_event (synced);
        CREATE INDEX IF NOT EXISTS idx_ping_unsynced ON outbox_ping (synced);
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

// --- kv (the background location task reads the active trip id from here) ---

export async function kvSet(key: string, value: string | null): Promise<void> {
  const db = await getDb();
  if (value === null) {
    await db.runAsync('DELETE FROM kv WHERE key = ?', key);
  } else {
    await db.runAsync(
      'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  }
}

export async function kvGet(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM kv WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export const KV_ACTIVE_TRIP_ID = 'active_trip_id';
