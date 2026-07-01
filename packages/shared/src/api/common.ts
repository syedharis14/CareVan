import { z } from 'zod';

/** Canonical Pakistani mobile: +923XXXXXXXXX. Normalize with `normalizePkPhone` first. */
export const PkPhoneSchema = z
  .string()
  .regex(/^\+923\d{9}$/, 'Phone must be a Pakistani mobile in +923XXXXXXXXX format');

export const PinSchema = z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits');

export const IdSchema = z.string().min(1);

export const LatSchema = z.number().min(-90).max(90);
export const LngSchema = z.number().min(-180).max(180);

/** Wire format for timestamps is ISO-8601; both sides parse into Date. */
export const DateSchema = z.coerce.date();
