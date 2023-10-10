import {
    globalOptionsSchema as coreGlobalOptionsSchema,
    PersistConfig,
    refineCoreConfig,
    unrefinedCoreConfigSchema,
    UploadConfig,
} from '@code-pushup/models';
import {z} from 'zod';
import {GlobalOptions as CliOptions} from "../model";

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
export type ArgsCliObj = Partial<
    CliOptions & GlobalOptions & UploadConfig & PersistConfig
>;
