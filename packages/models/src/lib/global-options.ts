import { z } from 'zod';
import { filePathSchema } from './implementation/schemas';

export const globalOptionsSchema = z.object({
  progress: z
    .boolean({
      description: 'Show progress bar in stdout',
    })
    .default(true),
  verbose: z
    .boolean({
      description: 'Outputs additional information for a run',
    })
    .default(false),
  // @TODO move to cli package as it is only used there
  config: filePathSchema(
    "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
  ).default('code-pushup.config.js'),
});

export type GlobalOptions = z.infer<typeof globalOptionsSchema>;
