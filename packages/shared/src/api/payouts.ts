import { z } from 'zod';
import { DateSchema, IdSchema, PkPhoneSchema } from './common.js';

/** Month key, "YYYY-MM". */
export const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be YYYY-MM');

export const PayoutQuerySchema = z.object({
  month: MonthSchema,
});
export type PayoutQuery = z.infer<typeof PayoutQuerySchema>;

/**
 * activeDays is computed server-side from LocationPing (days with a COMPLETED trip
 * having more than N pings) — never client-trusted. amountPkr = activeDays × rate.
 */
export const PayoutRowResponseSchema = z.object({
  driver: z.object({ id: IdSchema, name: z.string(), phone: PkPhoneSchema }),
  month: MonthSchema,
  activeDays: z.number().int(),
  amountPkr: z.number().int(),
  paidAt: DateSchema.nullable(),
});
export type PayoutRowResponse = z.infer<typeof PayoutRowResponseSchema>;

export const ListPayoutsResponseSchema = z.array(PayoutRowResponseSchema);
export type ListPayoutsResponse = z.infer<typeof ListPayoutsResponseSchema>;

export const MarkPayoutPaidRequestSchema = z.object({
  driverId: IdSchema,
  month: MonthSchema,
});
export type MarkPayoutPaidRequest = z.infer<typeof MarkPayoutPaidRequestSchema>;
