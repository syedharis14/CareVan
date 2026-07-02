import { z } from 'zod';
import { AlertChannelEnum, AlertStatusEnum, AlertTypeEnum } from '../enums.js';
import { DateSchema, IdSchema, PkPhoneSchema } from './common.js';

/** GET /alerts — the admin alert audit log (proves alert-delivery reliability). */
export const AlertAuditQuerySchema = z.object({
  status: AlertStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
export type AlertAuditQuery = z.infer<typeof AlertAuditQuerySchema>;

export const AlertAuditRowSchema = z.object({
  id: IdSchema,
  type: AlertTypeEnum,
  channel: AlertChannelEnum,
  status: AlertStatusEnum,
  message: z.string(),
  at: DateSchema,
  sentAt: DateSchema.nullable(),
  deliveredAt: DateSchema.nullable(),
  errorDetail: z.string().nullable(),
  tripId: IdSchema,
  studentName: z.string().nullable(),
  parent: z.object({ id: IdSchema, name: z.string(), phone: PkPhoneSchema }),
});
export type AlertAuditRow = z.infer<typeof AlertAuditRowSchema>;

export const AlertAuditResponseSchema = z.array(AlertAuditRowSchema);
export type AlertAuditResponse = z.infer<typeof AlertAuditResponseSchema>;
