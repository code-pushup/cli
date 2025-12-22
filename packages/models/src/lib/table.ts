import { z } from 'zod';
import { tableCellValueSchema } from './implementation/schemas.js';

export const tableAlignmentSchema = z.enum(['left', 'center', 'right']).meta({
  title: 'TableAlignment',
  description: 'Cell alignment',
});
export type TableAlignment = z.infer<typeof tableAlignmentSchema>;

export const tableColumnPrimitiveSchema = tableAlignmentSchema;
export type TableColumnPrimitive = z.infer<typeof tableColumnPrimitiveSchema>;

export const tableColumnObjectSchema = z
  .object({
    key: z.string(),
    label: z.string().optional(),
    align: tableAlignmentSchema.optional(),
  })
  .meta({ title: 'TableColumnObject' });
export type TableColumnObject = z.infer<typeof tableColumnObjectSchema>;

export const tableRowObjectSchema = z
  .record(z.string(), tableCellValueSchema)
  .meta({
    title: 'TableRowObject',
    description: 'Object row',
  });
export type TableRowObject = z.infer<typeof tableRowObjectSchema>;

export const tableRowPrimitiveSchema = z.array(tableCellValueSchema).meta({
  title: 'TableRowPrimitive',
  description: 'Primitive row',
});
export type TableRowPrimitive = z.infer<typeof tableRowPrimitiveSchema>;

const tableSharedSchema = z.object({
  title: z.string().optional().meta({ description: 'Display title for table' }),
});
const tablePrimitiveSchema = tableSharedSchema
  .merge(
    z.object({
      columns: z.array(tableAlignmentSchema).optional(),
      rows: z.array(tableRowPrimitiveSchema),
    }),
  )
  .meta({
    description: 'Table with primitive rows and optional alignment columns',
  });
const tableObjectSchema = tableSharedSchema
  .merge(
    z.object({
      columns: z
        .union([
          z.array(tableAlignmentSchema),
          z.array(tableColumnObjectSchema),
        ])
        .optional(),
      rows: z.array(tableRowObjectSchema),
    }),
  )
  .meta({
    description:
      'Table with object rows and optional alignment or object columns',
  });

export const tableSchema = (description = 'Table information') =>
  z
    .union([tablePrimitiveSchema, tableObjectSchema])
    .meta({ title: 'Table', description });
export type Table = z.infer<ReturnType<typeof tableSchema>>;
