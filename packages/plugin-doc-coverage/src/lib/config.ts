import { z } from 'zod';

export type DocType = 'percentage-coverage';

export const docCoveragePluginConfigSchema = z.object({
  coverageToolCommand: z
    .object({
      command: z
        .string({ description: 'Command to run coverage tool (compodoc).' })
        .min(1),
      args: z
        .array(z.string(), {
          description: 'Arguments to be passed to the coverage tool.',
        })
        .optional(),
    })
    .optional(),
  outputPath: z
    .string({ description: 'Path to the documentation.json file.' })
    .default('documentation/documentation.json'),
});

export type DocCoveragePluginConfig = z.infer<
  typeof docCoveragePluginConfigSchema
>;
