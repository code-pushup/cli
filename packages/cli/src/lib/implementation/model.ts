import {
  filePathSchema,
  GlobalOptions,
  PersistConfig,
  UploadConfig,
} from '@code-pushup/models';
import { z } from 'zod';

const cliOnlyGlobalOptionsSchema = z.object({
  interactive: z
    .boolean({
      description:
        'flag if interactivity should be considered. Useful for CI runs.',
    })
    .default(true),
  configPath: filePathSchema(
    "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
  ).default('code-pushup.config.js'),
});
export type CliOnlyGlobalOptions = z.infer<typeof cliOnlyGlobalOptionsSchema>;

export type CliArgs = Partial<
  GlobalOptions &
    CliOnlyGlobalOptions &
    UploadConfig &
    Omit<PersistConfig, 'format'> & { format: string }
>;
