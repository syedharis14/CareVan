import { z } from 'zod';
import { PaymentMethodEnum, SubscriptionStatusEnum } from '../enums.js';
import { DateSchema, IdSchema, PkPhoneSchema } from './common.js';

// --- Subscriptions (manual billing — no gateway in v1) ---

export const CreateSubscriptionRequestSchema = z.object({
  parentUserId: IdSchema,
  studentId: IdSchema,
  amountPkr: z.number().int().min(0).max(1_000_000),
});
export type CreateSubscriptionRequest = z.infer<typeof CreateSubscriptionRequestSchema>;

export const UpdateSubscriptionStatusRequestSchema = z.object({
  status: SubscriptionStatusEnum,
});
export type UpdateSubscriptionStatusRequest = z.infer<typeof UpdateSubscriptionStatusRequestSchema>;

export const RecordPaymentRequestSchema = z.object({
  amountPkr: z.number().int().min(1).max(1_000_000),
  method: PaymentMethodEnum,
  note: z.string().max(200).optional(),
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequestSchema>;

export const PaymentRecordResponseSchema = z.object({
  id: IdSchema,
  amountPkr: z.number().int(),
  method: PaymentMethodEnum,
  note: z.string().nullable(),
  recordedAt: DateSchema,
});
export type PaymentRecordResponse = z.infer<typeof PaymentRecordResponseSchema>;

export const SubscriptionResponseSchema = z.object({
  id: IdSchema,
  status: SubscriptionStatusEnum,
  amountPkr: z.number().int(),
  parent: z.object({ id: IdSchema, name: z.string(), phone: PkPhoneSchema }),
  student: z.object({ id: IdSchema, name: z.string() }),
  payments: z.array(PaymentRecordResponseSchema),
  paidTotalPkr: z.number().int(),
});
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

export const ListSubscriptionsResponseSchema = z.array(SubscriptionResponseSchema);
export type ListSubscriptionsResponse = z.infer<typeof ListSubscriptionsResponseSchema>;
