import { z } from 'zod';

export const basicObjectSchema = z.object({
  name: z.string(),
  age: z.number(),
  isStudent: z.boolean(),
  colors: z.enum(['red', 'green', 'blue']),
});

export const basicArraySchema = z.array(z.string());

export const basicUnionSchema = z.union([z.string(), z.number()]);

export const basicMixedSchema = z.object({
  object: basicObjectSchema,
  array: basicArraySchema,
  union: basicUnionSchema,
});
