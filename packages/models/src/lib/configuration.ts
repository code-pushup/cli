import { z } from 'zod';

/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const artifactGenerationCommandSchema = z.union([
  z.string({ description: 'Generate artifact files' }).min(1),
  z.object({
    command: z.string({ description: 'Generate artifact files' }).min(1),
    args: z.array(z.string()).optional(),
  }),
]);

export const pluginArtifactOptionsSchema = z.object({
  generateArtifactsCommand: artifactGenerationCommandSchema.optional(),
  artifactsPaths: z.union([z.string(), z.array(z.string()).min(1)]),
});

export type PluginArtifactOptions = z.infer<typeof pluginArtifactOptionsSchema>;
