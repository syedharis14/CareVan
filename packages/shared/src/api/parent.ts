import { z } from 'zod';
import { SubscriptionStatusEnum, TripTypeEnum } from '../enums.js';
import { DateSchema, IdSchema, LatSchema, LngSchema, PkPhoneSchema } from './common.js';

/**
 * GET /me/children — the parent home screen's data. One entry per child the parent
 * is linked to, with a server-derived status the child-status card renders. The app
 * polls this on open and on an interval (push is never guaranteed).
 */

/** Derived child status — drives the status card's dominant color + label. */
export const ChildStatusEnum = z.enum([
  'IDLE', // no active trip right now
  'WAITING', // pickup started, not yet boarded
  'ON_VAN_TO_SCHOOL',
  'AT_SCHOOL',
  'ON_VAN_TO_HOME',
  'AT_HOME',
]);
export type ChildStatus = z.infer<typeof ChildStatusEnum>;

export const LivePingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  speedKmh: z.number(),
  at: DateSchema,
});
export type LivePing = z.infer<typeof LivePingSchema>;

export const ChildSummarySchema = z.object({
  student: z.object({ id: IdSchema, name: z.string() }),
  school: z.object({ name: z.string(), lat: LatSchema, lng: LngSchema }),
  home: z.object({ lat: LatSchema, lng: LngSchema }),
  van: z
    .object({
      plateNo: z.string(),
      driverName: z.string(),
      driverPhone: PkPhoneSchema,
    })
    .nullable(),
  status: ChildStatusEnum,
  subscriptionStatus: SubscriptionStatusEnum.nullable(),
  activeTrip: z
    .object({
      id: IdSchema,
      type: TripTypeEnum,
      lastPing: LivePingSchema.nullable(),
    })
    .nullable(),
  /** Whether an SOS has been raised on the child's active trip (emergency banner). */
  sosActive: z.boolean(),
  /** Today's overspeed events on the child's van — the daily safety strip. */
  todayOverspeedCount: z.number().int(),
});
export type ChildSummary = z.infer<typeof ChildSummarySchema>;

export const ChildrenResponseSchema = z.array(ChildSummarySchema);
export type ChildrenResponse = z.infer<typeof ChildrenResponseSchema>;
