import { z } from 'zod';

export const typescriptPluginConfigSchema = z.object({
  tsConfigPath: z.string().describe('Path to the TsConfig'),
  tsCodes: z
    .array(z.number())
    .optional()
    .describe('Array with specific TsCodes to measure'),
});

export type TypescriptPluginConfig = z.infer<
  typeof typescriptPluginConfigSchema
>;
