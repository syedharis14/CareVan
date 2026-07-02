import { z } from 'zod';
import { TripEventTypeEnum, TripStatusEnum, TripTypeEnum } from '../enums.js';
import { DateSchema, IdSchema, LatSchema, LngSchema } from './common.js';

// --- Trip lifecycle ---

export const StartTripRequestSchema = z.object({
  vanId: IdSchema,
  type: TripTypeEnum,
});
export type StartTripRequest = z.infer<typeof StartTripRequestSchema>;

export const TripResponseSchema = z.object({
  id: IdSchema,
  vanId: IdSchema,
  type: TripTypeEnum,
  status: TripStatusEnum,
  startedAt: DateSchema,
  endedAt: DateSchema.nullable(),
});
export type TripResponse = z.infer<typeof TripResponseSchema>;

export const ListTripsQuerySchema = z.object({
  vanId: IdSchema.optional(),
  status: TripStatusEnum.optional(),
});
export type ListTripsQuery = z.infer<typeof ListTripsQuerySchema>;

export const ListTripsResponseSchema = z.array(TripResponseSchema);
export type ListTripsResponse = z.infer<typeof ListTripsResponseSchema>;

// --- Trip events (batched; ids are client-generated UUIDs so offline retries are idempotent) ---

export const TripEventInputSchema = z.object({
  /** Client-generated UUID — the server dedupes on it; safe to retry forever. */
  id: z.string().uuid(),
  studentId: IdSchema,
  type: TripEventTypeEnum,
  at: DateSchema,
  lat: LatSchema.optional(),
  lng: LngSchema.optional(),
});
export type TripEventInput = z.infer<typeof TripEventInputSchema>;

export const PostTripEventsRequestSchema = z.object({
  events: z.array(TripEventInputSchema).min(1).max(50),
});
export type PostTripEventsRequest = z.infer<typeof PostTripEventsRequestSchema>;

export const PostTripEventsResponseSchema = z.object({
  accepted: z.array(z.string()),
  duplicates: z.array(z.string()),
  rejected: z.array(z.object({ id: z.string(), reason: z.string() })),
});
export type PostTripEventsResponse = z.infer<typeof PostTripEventsResponseSchema>;

// --- Location pings (batched — never one ping per request) ---

export const PingInputSchema = z.object({
  /** Client-generated UUID — duplicates are silently skipped on retry. */
  id: z.string().uuid(),
  lat: LatSchema,
  lng: LngSchema,
  speedKmh: z.number().min(0).max(300),
  at: DateSchema,
});
export type PingInput = z.infer<typeof PingInputSchema>;

export const PostPingsRequestSchema = z.object({
  pings: z.array(PingInputSchema).min(1).max(300),
});
export type PostPingsRequest = z.infer<typeof PostPingsRequestSchema>;

export const PostPingsResponseSchema = z.object({
  inserted: z.number().int(),
  duplicates: z.number().int(),
});
export type PostPingsResponse = z.infer<typeof PostPingsResponseSchema>;

// --- Trip detail / recovery ---

export const TripEventResponseSchema = z.object({
  id: IdSchema,
  studentId: IdSchema,
  type: TripEventTypeEnum,
  at: DateSchema,
});
export type TripEventResponse = z.infer<typeof TripEventResponseSchema>;

export const TripDetailResponseSchema = TripResponseSchema.extend({
  events: z.array(TripEventResponseSchema),
  lastPing: z
    .object({ lat: z.number(), lng: z.number(), speedKmh: z.number(), at: DateSchema })
    .nullable(),
});
export type TripDetailResponse = z.infer<typeof TripDetailResponseSchema>;

/** GET /trips/mine/active — trip is null when the driver has no active trip. */
export const ActiveTripResponseSchema = z.object({
  trip: TripDetailResponseSchema.nullable(),
});
export type ActiveTripResponse = z.infer<typeof ActiveTripResponseSchema>;

// --- SOS (driver-triggered emergency; alerts parents of the van's roster) ---

export const SosRequestSchema = z.object({
  note: z.string().max(200).optional(),
});
export type SosRequest = z.infer<typeof SosRequestSchema>;

export const SosResponseSchema = z.object({
  /** Number of parent recipients an AlertLog row was created for. */
  created: z.number().int(),
});
export type SosResponse = z.infer<typeof SosResponseSchema>;
