import { z } from 'zod';

export const tableHeadingSchema = z.object(
  {
    key: z.string(),
    label: z.string().optional(),
  },
  { description: 'Table heading' },
);
export type TableHeading = z.infer<typeof tableHeadingSchema>;

export const tableAlignmentSchema = z.enum(['l', 'c', 'r'], {
  description: 'Cell alignment',
});
export type TableAlignment = z.infer<typeof tableAlignmentSchema>;

export const primitiveValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);
export type PrimitiveValue = z.infer<typeof primitiveValueSchema>;

export const tableRowSchema = z.union([
  z.array(primitiveValueSchema),
  z.record(primitiveValueSchema),
]);
export type TableRow = z.infer<typeof tableRowSchema>;

export const tableSchema = (description = 'Table information') =>
  z.object(
    {
      headings: z.array(tableHeadingSchema).optional(),
      alignment: z.array(tableAlignmentSchema).optional(),
      rows: z.array(tableRowSchema),
    },
    { description },
  );
export type Table = z.infer<ReturnType<typeof tableSchema>>;
