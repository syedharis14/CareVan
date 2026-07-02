import Constants from 'expo-constants';

/**
 * API base URL. Order: EXPO_PUBLIC_API_URL env → app.json `extra.apiUrl` → localhost.
 * On a real device use your dev machine's LAN IP (e.g. http://192.168.1.20:3005),
 * NOT localhost — the phone can't reach the laptop's loopback.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:3005';

/** Driver tracking cadence (see mobile/CLAUDE.md). */
export const PING_INTERVAL_MS = 12_000;
export const PING_DISTANCE_M = 25;
/** Foreground sync cadence — batch upload of queued events + pings. */
export const SYNC_INTERVAL_MS = 30_000;
