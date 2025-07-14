import { z } from 'zod';
import { tableCellValueSchema } from './implementation/schemas.js';

export const tableAlignmentSchema = z
  .enum(['left', 'center', 'right'])
  .describe('Cell alignment');
export type TableAlignment = z.infer<typeof tableAlignmentSchema>;

export const tableColumnPrimitiveSchema = tableAlignmentSchema;
export type TableColumnPrimitive = z.infer<typeof tableColumnPrimitiveSchema>;

export const tableColumnObjectSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  align: tableAlignmentSchema.optional(),
});
export type TableColumnObject = z.infer<typeof tableColumnObjectSchema>;

export const tableRowObjectSchema = z
  .record(tableCellValueSchema)
  .describe('Object row');
export type TableRowObject = z.infer<typeof tableRowObjectSchema>;

export const tableRowPrimitiveSchema = z
  .array(tableCellValueSchema)
  .describe('Primitive row');
export type TableRowPrimitive = z.infer<typeof tableRowPrimitiveSchema>;

const tableSharedSchema = z.object({
  title: z.string().optional().describe('Display title for table'),
});
const tablePrimitiveSchema = tableSharedSchema
  .merge(
    z.object({
      columns: z.array(tableAlignmentSchema).optional(),
      rows: z.array(tableRowPrimitiveSchema),
    }),
  )
  .describe('Table with primitive rows and optional alignment columns');
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
  .describe('Table with object rows and optional alignment or object columns');

export const tableSchema = (description = 'Table information') =>
  z.union([tablePrimitiveSchema, tableObjectSchema]).describe(description);
export type Table = z.infer<ReturnType<typeof tableSchema>>;
