/**
 * Scripted sales-demo route through the real Gulberg (Lahore) streets. The demo drives the
 * full day in three legs so the founder can narrate the whole story:
 *
 *   1. approach  — van drives TO the child's home to pick up (child shows "waiting")
 *   2. toSchool  — home → school gate; BOARDED at home, REACHED_SCHOOL by the real geofence
 *   3. toHome    — school → home; REACHED_HOME by the real geofence
 *
 * No hardcoded timers or faked events: BOARDED goes through the event pipeline and the
 * REACHED_* alerts are derived by the real geofence as the van enters each fence.
 *
 * DEMO_HOME MUST equal the seeded demo student's homeLat/homeLng and DEMO_SCHOOL the seeded
 * demo school (see prisma/seed.ts) — the geofence keys off those coordinates.
 */
export type Coord = { lat: number; lng: number };

export const DEMO_HOME = { lat: 31.5128, lng: 74.3468 } as const;
export const DEMO_SCHOOL = { lat: 31.5085, lng: 74.343 } as const;

/** Leg 2 — pickup drive: home → school gate (the last points fall inside the school fence). */
const TO_SCHOOL: Coord[] = [
  { lat: 31.5128, lng: 74.3468 }, // HOME (pickup point, ~600 m from school)
  { lat: 31.51247, lng: 74.34651 },
  { lat: 31.51214, lng: 74.34621 },
  { lat: 31.51181, lng: 74.34592 },
  { lat: 31.51148, lng: 74.34563 },
  { lat: 31.51115, lng: 74.34534 },
  { lat: 31.51082, lng: 74.34504 },
  { lat: 31.51049, lng: 74.34475 },
  { lat: 31.51016, lng: 74.34446 }, // ~230 m out (still outside the 200 m fence)
  { lat: 31.50983, lng: 74.34416 }, // ~185 m — enters the school fence → REACHED_SCHOOL
  { lat: 31.5095, lng: 74.34387 },
  { lat: 31.50917, lng: 74.34358 },
  { lat: 31.50884, lng: 74.34328 },
  { lat: DEMO_SCHOOL.lat, lng: DEMO_SCHOOL.lng }, // school gate
];

/** Leg 1 — approach: van drives in toward home to pick up, ending AT home. Points are spaced
 * ~46 m apart (≈27 km/h at the 6 s cadence) so the approach never trips the overspeed limit. */
const APPROACH: Coord[] = [
  { lat: 31.514, lng: 74.34812 }, // ~180 m NE of home
  { lat: 31.5137, lng: 74.34779 },
  { lat: 31.5134, lng: 74.34746 },
  { lat: 31.5131, lng: 74.34713 },
  { lat: DEMO_HOME.lat, lng: DEMO_HOME.lng }, // arrives at home
];

/** Leg 3 — dropoff drive: school → home (enters the home fence at the end → REACHED_HOME). */
const TO_HOME: Coord[] = [...TO_SCHOOL].reverse();

export const DEMO_LEGS: { approach: Coord[]; toSchool: Coord[]; toHome: Coord[] } = {
  approach: APPROACH,
  toSchool: TO_SCHOOL,
  toHome: TO_HOME,
};

/** Back-compat alias for the original single pickup route (home → school). */
export const DEMO_ROUTE = TO_SCHOOL;

/** Seconds between scripted pings; total run ≈ (all legs) × this. */
export const DEMO_PING_INTERVAL_S = 6;
