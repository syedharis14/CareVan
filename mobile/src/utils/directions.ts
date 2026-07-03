import { z } from 'zod';

export type RoutePoint = { latitude: number; longitude: number };
type LatLng = { lat: number; lng: number };

/** Minimal shape of the Google Directions response we consume (zod at the boundary). */
const DirectionsResponse = z.object({
  status: z.string(),
  routes: z
    .array(z.object({ overview_polyline: z.object({ points: z.string() }) }))
    .default([]),
});

/**
 * Decode a Google "encoded polyline" into lat/lng points.
 * Standard algorithm — see developers.google.com/maps/documentation/utilities/polylinealgorithm.
 */
export function decodePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

/**
 * Fetch the driving route between two points as map coordinates. Returns null on any failure
 * (no key, network error, REQUEST_DENIED, no route) so callers fall back to a straight line —
 * the map must never break the live-trip view.
 */
export async function fetchRoute(
  origin: LatLng,
  dest: LatLng,
  apiKey: string,
): Promise<RoutePoint[] | null> {
  if (!apiKey) return null;
  try {
    const url =
      'https://maps.googleapis.com/maps/api/directions/json' +
      `?origin=${origin.lat},${origin.lng}` +
      `&destination=${dest.lat},${dest.lng}` +
      '&mode=driving' +
      `&key=${apiKey}`;
    const res = await fetch(url);
    const json: unknown = await res.json();
    const parsed = DirectionsResponse.safeParse(json);
    const first = parsed.success && parsed.data.status === 'OK' ? parsed.data.routes[0] : undefined;
    if (!first) return null;
    const points = decodePolyline(first.overview_polyline.points);
    return points.length > 1 ? points : null;
  } catch {
    return null;
  }
}
