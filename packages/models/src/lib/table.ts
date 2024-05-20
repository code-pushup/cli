import { z } from 'zod';
import { primitiveValueSchema } from './implementation/schemas';

export const tableAlignmentSchema = z.enum(['left', 'center', 'right'], {
  description: 'Cell alignment',
});
export type TableAlignment = z.infer<typeof tableAlignmentSchema>;

export const tableColumnPrimitiveSchema = tableAlignmentSchema;
export type TableColumnPrimitive = z.infer<typeof tableColumnPrimitiveSchema>;

export const tableColumnObjectSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  align: tableAlignmentSchema.optional(),
});
export type TableColumnObject = z.infer<typeof tableColumnObjectSchema>;

export const tableRowObjectSchema = z.record(primitiveValueSchema, {
  description: 'Object row',
});
export type TableRowObject = z.infer<typeof tableRowObjectSchema>;

export const tableRowPrimitiveSchema = z.array(primitiveValueSchema, {
  description: 'Primitive row',
});
export type TableRowPrimitive = z.infer<typeof tableRowPrimitiveSchema>;

const tablePrimitiveSchema = z.object(
  {
    columns: z.array(tableAlignmentSchema).optional(),
    rows: z.array(tableRowPrimitiveSchema),
  },
  { description: 'Table with primitive rows and optional alignment columns' },
);

const tableObjectSchema = z.object(
  {
    columns: z
      .union([z.array(tableAlignmentSchema), z.array(tableColumnObjectSchema)])
      .optional(),
    rows: z.array(tableRowObjectSchema),
  },
  {
    description:
      'Table with object rows and optional alignment or object columns',
  },
);

export const tableSchema = (description = 'Table information') =>
  z.union([tablePrimitiveSchema, tableObjectSchema], { description });
export type Table = z.infer<ReturnType<typeof tableSchema>>;
