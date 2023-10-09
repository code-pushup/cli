import { globalOptionsSchema as coreGlobalOptionsSchema } from '@code-pushup/models';
import { z } from 'zod';

export const globalOptionsSchema = coreGlobalOptionsSchema.merge(
  z.object({
    interactive: z
      .boolean({
        description:
          'flag if interactivity should be considered. Useful for CI runs.',
      })
      .default(true),
  }),
);

export type GlobalOptions = z.infer<typeof globalOptionsSchema>;


