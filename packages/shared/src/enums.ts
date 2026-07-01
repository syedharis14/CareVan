import { z } from 'zod';

/**
 * Domain enums — mirror `backend/prisma/schema.prisma` exactly.
 * The Prisma enums and these zod enums must never drift; the api-contract-keeper
 * agent checks both sides on any change.
 */

export const RoleEnum = z.enum(['PARENT', 'DRIVER', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

export const TripTypeEnum = z.enum(['PICKUP', 'DROPOFF']);
export type TripType = z.infer<typeof TripTypeEnum>;

export const TripStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'ABORTED']);
export type TripStatus = z.infer<typeof TripStatusEnum>;

export const TripEventTypeEnum = z.enum(['BOARDED', 'DROPPED', 'ABSENT']);
export type TripEventType = z.infer<typeof TripEventTypeEnum>;

export const SafetyEventTypeEnum = z.enum(['OVERSPEED']);
export type SafetyEventType = z.infer<typeof SafetyEventTypeEnum>;

export const SubscriptionStatusEnum = z.enum(['ACTIVE', 'UNPAID', 'CANCELLED']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const PaymentMethodEnum = z.enum(['CASH', 'TRANSFER']);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const AlertChannelEnum = z.enum(['PUSH', 'SMS_FALLBACK']);
export type AlertChannel = z.infer<typeof AlertChannelEnum>;

export const AlertTypeEnum = z.enum([
  'BOARDED',
  'DROPPED',
  'REACHED_SCHOOL',
  'REACHED_HOME',
  'OVERSPEED',
  'SOS',
]);
export type AlertType = z.infer<typeof AlertTypeEnum>;

export const AlertStatusEnum = z.enum(['CREATED', 'SENT', 'DELIVERED', 'FAILED']);
export type AlertStatus = z.infer<typeof AlertStatusEnum>;
