import { z } from 'zod';

export const RegisterPushTokenRequestSchema = z.object({
  /** Expo push token, e.g. ExponentPushToken[xxxx]. */
  token: z.string().min(10).max(200),
});
export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequestSchema>;
