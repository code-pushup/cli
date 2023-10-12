import { z } from 'zod';
import {
  Format,
  globalOptionsSchema as coreGlobalOptionsSchema,
  GlobalOptions as CoreGlobalOptions,
  PersistConfig,
  UploadConfig,
  globalOptionsSchema as coreGlobalOptionsSchema,
  refineCoreConfig,
  unrefinedCoreConfigSchema,
} from '@code-pushup/models';
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

// @TODO this has any type
export const commandBaseSchema = refineCoreConfig(
  globalOptionsSchema.merge(unrefinedCoreConfigSchema),
);
export type CommandBase = z.infer<typeof commandBaseSchema>;
export type TerminalArgsObj = Partial<
  GlobalOptions &
    CoreGlobalOptions &
    UploadConfig &
    Omit<PersistConfig, 'format'> & {
      format: Format[];
    }
>;
