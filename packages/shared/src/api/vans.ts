import { z } from 'zod';
import { IdSchema, PkPhoneSchema } from './common.js';

export const CreateVanRequestSchema = z.object({
  driverId: IdSchema,
  plateNo: z.string().min(2).max(20),
  capacity: z.number().int().min(1).max(40),
  schoolId: IdSchema,
});
export type CreateVanRequest = z.infer<typeof CreateVanRequestSchema>;

export const UpdateVanRequestSchema = CreateVanRequestSchema.partial();
export type UpdateVanRequest = z.infer<typeof UpdateVanRequestSchema>;

export const VanResponseSchema = z.object({
  id: IdSchema,
  plateNo: z.string(),
  capacity: z.number().int(),
  driver: z.object({ id: IdSchema, name: z.string(), phone: PkPhoneSchema }),
  school: z.object({ id: IdSchema, name: z.string() }),
});
export type VanResponse = z.infer<typeof VanResponseSchema>;

export const ListVansResponseSchema = z.array(VanResponseSchema);
export type ListVansResponse = z.infer<typeof ListVansResponseSchema>;

// --- Van roster (VanStudent mapping) ---

export const AssignVanStudentRequestSchema = z.object({
  studentId: IdSchema,
  stopOrder: z.number().int().min(1),
});
export type AssignVanStudentRequest = z.infer<typeof AssignVanStudentRequestSchema>;

export const UpdateStopOrderRequestSchema = z.object({
  stopOrder: z.number().int().min(1),
});
export type UpdateStopOrderRequest = z.infer<typeof UpdateStopOrderRequestSchema>;

export const VanRosterEntrySchema = z.object({
  stopOrder: z.number().int(),
  student: z.object({ id: IdSchema, name: z.string() }),
});
export type VanRosterEntry = z.infer<typeof VanRosterEntrySchema>;

/** Ordered by stopOrder ascending. */
export const VanRosterResponseSchema = z.array(VanRosterEntrySchema);
export type VanRosterResponse = z.infer<typeof VanRosterResponseSchema>;
