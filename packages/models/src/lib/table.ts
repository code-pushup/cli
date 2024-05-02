import { z } from 'zod';
import { primitiveValueSchema } from './implementation/schemas';

export const tableAlignmentSchema = z.enum(['l', 'c', 'r'], {
  description: 'Cell alignment (l:left, r:right, c:center)',
});
export type TableAlignment = z.infer<typeof tableAlignmentSchema>;

export const tableHeadingSchema = z.object(
  {
    key: z.string().optional(),
    label: z.string().optional(),
    align: tableAlignmentSchema.optional(),
  },
  { description: 'Table heading' },
);
export type TableHeading = z.infer<typeof tableHeadingSchema>;

export const tableRowSchema = z.union([
  z.array(primitiveValueSchema),
  z.record(primitiveValueSchema),
]);
export type TableRow = z.infer<typeof tableRowSchema>;

export const tableSchema = (description = 'Table information') =>
  z.object(
    {
      headings: z.array(tableHeadingSchema).optional(),
      rows: z.array(tableRowSchema),
    },
    { description },
  );
export type Table = z.infer<ReturnType<typeof tableSchema>>;
