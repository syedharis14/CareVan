/**
 * Parent-facing push copy — v1 is English + Roman Urdu-friendly phrasing.
 * The exact string is stored on the AlertLog row at creation time (audit truth).
 */
export const alertMessage = {
  BOARDED: (student: string) => `${student} boarded the van`,
  DROPPED: (student: string) => `${student} got off the van`,
  REACHED_SCHOOL: (student: string) => `${student} reached school`,
  REACHED_HOME: (student: string) => `Van is arriving — ${student} is being dropped home`,
  OVERSPEED: (plateNo: string, speedKmh: number) =>
    `Safety alert: van ${plateNo} exceeded the speed limit (${Math.round(speedKmh)} km/h)`,
  SOS: (name: string) => `EMERGENCY: SOS triggered by ${name}`,
} as const;

export const ALERT_TITLE = 'CareVan';
