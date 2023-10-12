import { z } from 'zod';

export const globalOptionsSchema = z.object({
  verbose: z
    .boolean({
      description: 'Outputs additional information for a run',
    })
    .default(false),
});

export type GlobalOptions = z.infer<typeof globalOptionsSchema>;
