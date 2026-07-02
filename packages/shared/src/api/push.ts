import { z } from 'zod';

export const RegisterPushTokenRequestSchema = z.object({
  /** Expo push token, e.g. ExponentPushToken[xxxx]. */
  token: z.string().min(10).max(200),
});
export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequestSchema>;

/**
 * The `data` payload attached to every alert push (dispatched by the backend, read
 * by the mobile push-tap router). Kept here so both sides share one shape.
 */
export const AlertPushDataSchema = z.object({
  type: z.string().optional(),
  tripId: z.string().optional(),
  studentId: z.string().optional(),
});
export type AlertPushData = z.infer<typeof AlertPushDataSchema>;
