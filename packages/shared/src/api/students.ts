import { z } from 'zod';
import { IdSchema, LatSchema, LngSchema, PkPhoneSchema } from './common.js';

export const CreateStudentRequestSchema = z.object({
  name: z.string().min(1).max(100),
  schoolId: IdSchema,
  homeLat: LatSchema,
  homeLng: LngSchema,
  pickupNotes: z.string().max(500).optional(),
});
export type CreateStudentRequest = z.infer<typeof CreateStudentRequestSchema>;

export const UpdateStudentRequestSchema = z
  .object({
    name: z.string().min(1).max(100),
    schoolId: IdSchema,
    homeLat: LatSchema,
    homeLng: LngSchema,
    pickupNotes: z.string().max(500).nullable(),
  })
  .partial();
export type UpdateStudentRequest = z.infer<typeof UpdateStudentRequestSchema>;

export const StudentResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  homeLat: z.number(),
  homeLng: z.number(),
  pickupNotes: z.string().nullable(),
  school: z.object({ id: IdSchema, name: z.string() }),
  parents: z.array(z.object({ id: IdSchema, name: z.string(), phone: PkPhoneSchema })),
});
export type StudentResponse = z.infer<typeof StudentResponseSchema>;

export const ListStudentsQuerySchema = z.object({
  schoolId: IdSchema.optional(),
});
export type ListStudentsQuery = z.infer<typeof ListStudentsQuerySchema>;

export const ListStudentsResponseSchema = z.array(StudentResponseSchema);
export type ListStudentsResponse = z.infer<typeof ListStudentsResponseSchema>;

// --- Student ↔ parent mapping ---

export const AssignParentRequestSchema = z.object({
  parentUserId: IdSchema,
});
export type AssignParentRequest = z.infer<typeof AssignParentRequestSchema>;
