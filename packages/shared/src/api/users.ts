import { z } from 'zod';
import { RoleEnum } from '../enums.js';
import { DateSchema, IdSchema, PinSchema, PkPhoneSchema } from './common.js';

export const CreateUserRequestSchema = z.object({
  phone: PkPhoneSchema,
  name: z.string().min(1).max(100),
  role: RoleEnum,
  pin: PinSchema,
});
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;

export const UpdateUserRequestSchema = z
  .object({
    phone: PkPhoneSchema,
    name: z.string().min(1).max(100),
    pin: PinSchema,
  })
  .partial();
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

/** Never includes pinHash — parsing responses through this schema strips it by construction. */
export const UserResponseSchema = z.object({
  id: IdSchema,
  phone: PkPhoneSchema,
  name: z.string(),
  role: RoleEnum,
  createdAt: DateSchema,
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

export const ListUsersQuerySchema = z.object({
  role: RoleEnum.optional(),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export const ListUsersResponseSchema = z.array(UserResponseSchema);
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;
