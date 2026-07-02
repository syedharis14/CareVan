import { z } from 'zod';
import { TripTypeEnum } from '../enums.js';
import { DateSchema, IdSchema, LatSchema, LngSchema } from './common.js';
import { LivePingSchema } from './parent.js';

/** GET /trips/live — active trips for the admin live map, polled ~10s. */
export const LiveTripRowSchema = z.object({
  id: IdSchema,
  type: TripTypeEnum,
  startedAt: DateSchema,
  van: z.object({ plateNo: z.string() }),
  driver: z.object({ name: z.string() }),
  school: z.object({ name: z.string(), lat: LatSchema, lng: LngSchema }),
  lastPing: LivePingSchema.nullable(),
  boardedCount: z.number().int(),
  rosterCount: z.number().int(),
});
export type LiveTripRow = z.infer<typeof LiveTripRowSchema>;

export const LiveTripsResponseSchema = z.array(LiveTripRowSchema);
export type LiveTripsResponse = z.infer<typeof LiveTripsResponseSchema>;
