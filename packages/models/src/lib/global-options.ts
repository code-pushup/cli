import { z } from 'zod';
import { filePathSchema } from './implementation/schemas';

export const globalOptionsSchema = z.object({
  verbose: z
    .boolean({
      description: 'Outputs additional information for a run',
    })
    .default(false),
  config: filePathSchema(
    "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
  ).default('code-pushup.config.js'),
});

export type GlobalOptions = z.infer<typeof globalOptionsSchema>;
