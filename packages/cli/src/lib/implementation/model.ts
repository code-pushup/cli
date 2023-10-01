import {
  globalOptionsSchema as coreGlobalOptionsSchema,
  refineCoreConfig,
  unrefinedCoreConfigSchema
} from "@quality-metrics/models";
import {z} from "zod";

export const globalOptionsSchema = coreGlobalOptionsSchema
  .merge(z.object({
    interactive: z.boolean({
      description:
        'flag if interactivity should be considered. Useful for CI runs.',
    }).default(true)
  }));

export type GlobalOptions = z.infer<typeof globalOptionsSchema>;

export const commandBaseSchema = refineCoreConfig(
  globalOptionsSchema.merge(unrefinedCoreConfigSchema),
);
export type CommandBase = z.infer<typeof commandBaseSchema>;
