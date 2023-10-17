import { z } from 'zod';
import {
  Format,
  globalOptionsSchema as coreGlobalOptionsSchema,
  refineCoreConfig,
  unrefinedCoreConfigSchema,
} from '@code-pushup/models';

export const generalCliOptionsSchema = coreGlobalOptionsSchema.merge(
  z.object({
    interactive: z
      .boolean({
        description:
          'flag if interactivity should be considered. Useful for CI runs.',
      })
      .default(true),
  }),
);
export type GeneralCliOptions = z.infer<typeof generalCliOptionsSchema>;

// @TODO this has any type
export const commandBaseSchema = refineCoreConfig(
  generalCliOptionsSchema.merge(unrefinedCoreConfigSchema),
);
export type CommandBase = z.infer<typeof commandBaseSchema>;
export type CoreConfigCliOptions = {
  'persist.outputDir': string;
  'persist.format': Format | string;
  'upload.organization': string;
  'upload.project': string;
  'upload.apiKey': string;
  'upload.server': string;
};
export type ArgsCliObj = Partial<GeneralCliOptions & CoreConfigCliOptions>;
