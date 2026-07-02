/** Haversine distance in metres. Mirrors the backend's geofence math (no routing). */
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Rough ETA in minutes: straight-line distance ÷ speed. NOT a routing engine —
 * a deliberately simple estimate (v1 scope). Falls back to a default city speed
 * when the van is slow/stopped so a red light doesn't show "∞".
 */
export function etaMinutes(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  speedKmh: number,
): number | null {
  const meters = distanceMeters(fromLat, fromLng, toLat, toLng);
  const effectiveKmh = speedKmh >= 8 ? speedKmh : 22; // assume ~22 km/h when crawling/stopped
  const minutes = (meters / 1000 / effectiveKmh) * 60;
  if (!Number.isFinite(minutes)) return null;
  return Math.max(1, Math.round(minutes));
}
