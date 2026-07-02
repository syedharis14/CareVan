import { z } from 'zod';
import { DateSchema, IdSchema } from './common.js';

/** POST /demo/start — kicks off the scripted Lahore-route demo trip. */
export const DemoStartResponseSchema = z.object({
  tripId: IdSchema,
  message: z.string(),
});
export type DemoStartResponse = z.infer<typeof DemoStartResponseSchema>;

/** GET /demo/status — live progress the admin panel polls during the demo. */
export const DemoStatusResponseSchema = z.object({
  running: z.boolean(),
  tripId: IdSchema.nullable(),
  boardedFired: z.boolean(),
  reachedFired: z.boolean(),
  pingsSent: z.number().int(),
  totalPings: z.number().int(),
  startedAt: DateSchema.nullable(),
});
export type DemoStatusResponse = z.infer<typeof DemoStatusResponseSchema>;
