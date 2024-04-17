import { z } from 'zod';

const headingsSchema = z.object(
  {
    key: z.string(),
    label: z.string().optional(),
  },
  { description: 'Source file location' },
);

export type Headings = z.infer<typeof headingsSchema>;
export const tableSchema = (description = 'Table information') =>
  z.object(
    {
      headings: z.array(headingsSchema).optional(),
      items: z.array(z.union([z.unknown(), z.record(z.string())])),
    },
    { description },
  );
export type Table = z.infer<ReturnType<typeof tableSchema>>;