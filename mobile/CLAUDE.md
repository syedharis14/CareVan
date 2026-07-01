# mobile/ — ONE Expo app, two roles

Expo (latest SDK) + **expo-dev-client** + TypeScript + zustand + React Navigation. Read the root
CLAUDE.md first; the locked v1 scope applies.

## Non-negotiables

- **Never suggest or use Expo Go.** Background location requires a development build. Local dev =
  dev client (`eas build --profile development` once per platform, then
  `pnpm expo start --dev-client`).
- ONE app; the role comes from the JWT at login and selects `DriverStack` or `ParentStack`
  (React Navigation). No role-switch UI beyond logout.
- **Offline-first**: every trip event and location ping is written to the local queue
  (expo-sqlite or MMKV) **before** any network attempt.
- Battery and data are adoption-critical: **no polling loops, no per-ping uploads.** Battery drain
  = driver uninstalls = product dead.

## Background location architecture (driver, active trip only)

- Android: foreground service via expo-location `startLocationUpdatesAsync` with the
  foregroundService option — persistent notification "CareVan trip in progress".
- Ping every 10–15 s while moving (time + distance intervals); emit less when stationary.
- Batch upload every 30–60 s (or ~20 queued pings, whichever first) to `POST /trips/:id/pings`.
- Store-and-forward: pings/events append to the persistent local queue with client-generated
  UUIDs; an uploader drains FIFO with exponential backoff; the server dedupes by id, so retries
  are always safe. The queue must survive app kill — persisted, never in-memory only.
- Tracking runs **only** during an active trip; trip end stops the service immediately.
- iOS: background location mode in app config; permission flow upgrades While-Using → Always
  during driver onboarding; expect and test suspension/relaunch behavior.

## ColorOS / MIUI battery caveats (the Oppo F21 Pro problem)

ColorOS aggressively kills background apps. Mandatory handling:

- Driver onboarding includes a **battery-whitelist setup screen**: detect manufacturer
  (expo-device), show step-by-step instructions to disable battery optimization / allow
  auto-start for CareVan, deep-link into settings where the platform allows.
- Re-check on every app open; show a persistent warning banner while not whitelisted.
- Crash/kill recovery: on app open, if an ACTIVE trip exists (local queue or server), rehydrate
  the active-trip screen and restart tracking without losing queued events.

## State & storage

- zustand for app state; MMKV (or SQLite) for the offline queue, auth token, and cached
  today-data.
- Parent side is push-first but **always reconciles on open** (fetch trip/child status on
  foreground) — push delivery is never guaranteed, the UI must not depend on it.

## UX laws

- Driver: max **1 decision per screen**; touch targets >= 56 px; primary action is a full-width
  bottom button (18–20 semibold); usable one-handed while standing at a van door.
- Parent: the home screen **is** the child-status card — status color dominates (safe green /
  transit amber); everything else is secondary.
- Tokens come from `@carevan/shared` — never hardcode hex values. Red = SOS/danger only.
  Status is never color-only: always icon + label.

## EAS builds

- `eas build --profile development --platform android` / `--platform ios` — dev client, internal
  distribution (iOS 16+ target for the iPhone dev build).
- `eas build --profile preview --platform android` — APK for sideloading onto the Oppo F21 Pro.
- App id: `com.aamirtech.carevan` on both platforms; display name "CareVan".
