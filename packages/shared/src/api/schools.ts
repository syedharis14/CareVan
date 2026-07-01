import { z } from 'zod';
import { IdSchema, LatSchema, LngSchema } from './common.js';

export const CreateSchoolRequestSchema = z.object({
  name: z.string().min(1).max(200),
  lat: LatSchema,
  lng: LngSchema,
  address: z.string().min(1).max(500),
});
export type CreateSchoolRequest = z.infer<typeof CreateSchoolRequestSchema>;

export const UpdateSchoolRequestSchema = CreateSchoolRequestSchema.partial();
export type UpdateSchoolRequest = z.infer<typeof UpdateSchoolRequestSchema>;

export const SchoolResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  address: z.string(),
});
export type SchoolResponse = z.infer<typeof SchoolResponseSchema>;

export const ListSchoolsResponseSchema = z.array(SchoolResponseSchema);
export type ListSchoolsResponse = z.infer<typeof ListSchoolsResponseSchema>;
