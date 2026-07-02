import { z } from 'zod';
import { IdSchema, LatSchema, LngSchema } from './common.js';

/**
 * GET /me/van — the driver's van(s) with the ordered student roster the app needs
 * to render the boarding list. A driver with no van assigned gets an empty array.
 */

export const DriverRosterStudentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  stopOrder: z.number().int(),
  homeLat: z.number(),
  homeLng: z.number(),
  pickupNotes: z.string().nullable(),
});
export type DriverRosterStudent = z.infer<typeof DriverRosterStudentSchema>;

export const DriverVanSchema = z.object({
  id: IdSchema,
  plateNo: z.string(),
  capacity: z.number().int(),
  school: z.object({
    id: IdSchema,
    name: z.string(),
    lat: LatSchema,
    lng: LngSchema,
  }),
  /** Ordered by stopOrder ascending. */
  students: z.array(DriverRosterStudentSchema),
});
export type DriverVan = z.infer<typeof DriverVanSchema>;

export const DriverVansResponseSchema = z.array(DriverVanSchema);
export type DriverVansResponse = z.infer<typeof DriverVansResponseSchema>;
