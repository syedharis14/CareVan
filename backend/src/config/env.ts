import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().startsWith('postgresql://', 'DATABASE_URL must be a postgres URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().positive().default(3005),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Comma-separated allowlist. Unset = reflect any origin (dev only). */
  CORS_ORIGINS: z.string().optional(),
  /** Geofence radius for REACHED_SCHOOL / REACHED_HOME (meters). */
  GEOFENCE_RADIUS_M: z.coerce.number().positive().default(200),
  /** Speed above this records SafetyEvents and (throttled) OVERSPEED alerts. */
  OVERSPEED_LIMIT_KMH: z.coerce.number().positive().default(60),
  /** Minimum minutes between OVERSPEED alerts on one trip. */
  OVERSPEED_ALERT_COOLDOWN_MIN: z.coerce.number().positive().default(5),
  /** Optional Expo access token for the push API. */
  EXPO_ACCESS_TOKEN: z.string().optional(),
  /** A day "counts" for driver payout if a COMPLETED trip that day had > this many pings. */
  ACTIVE_DAY_MIN_PINGS: z.coerce.number().int().positive().default(20),
  /** Driver payout rate per verified active day (PKR). */
  PAYOUT_PER_ACTIVE_DAY_PKR: z.coerce.number().int().min(0).default(300),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment — ${details}`);
  }
  return parsed.data;
}

export const env = loadEnv();
