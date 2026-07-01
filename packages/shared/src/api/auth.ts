import { z } from 'zod';
import { RoleEnum } from '../enums.js';
import { IdSchema, PinSchema, PkPhoneSchema } from './common.js';

export const LoginRequestSchema = z.object({
  phone: PkPhoneSchema,
  pin: PinSchema,
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: IdSchema,
  phone: PkPhoneSchema,
  name: z.string(),
  role: RoleEnum,
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const MeResponseSchema = AuthUserSchema;
export type MeResponse = z.infer<typeof MeResponseSchema>;
