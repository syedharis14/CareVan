/**
 * Scripted sales-demo route: ~600 m along Main Boulevard, Gulberg, Lahore, ending
 * AT the demo school (the last points fall inside its geofence). The van starts well
 * outside the school fence so the real enter-transition geofence logic fires
 * REACHED_SCHOOL when it arrives — no hardcoded timers, no faked events.
 *
 * These coordinates MUST match the seeded demo school location (see prisma/seed.ts).
 */
export const DEMO_SCHOOL = { lat: 31.5085, lng: 74.343 } as const;

/** Ordered polyline from the pickup point to the school gate. */
export const DEMO_ROUTE: { lat: number; lng: number }[] = [
  { lat: 31.5128, lng: 74.3468 }, // pickup point (~600 m from school)
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
  { lat: DEMO_SCHOOL.lat, lng: DEMO_SCHOOL.lng }, // school gate — must equal the seeded demo school
];

/** Seconds between scripted pings; total run ≈ ROUTE.length × this. */
export const DEMO_PING_INTERVAL_S = 6;
