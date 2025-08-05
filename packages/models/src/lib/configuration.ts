import { z } from 'zod';

/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const artifactGenerationCommandSchema = z.union([
  z.string().min(1).describe('Generate artifact files'),
  z.object({
    command: z.string().min(1).describe('Generate artifact files'),
    args: z.array(z.string()).optional(),
  }),
]);

export const pluginArtifactOptionsSchema = z.object({
  generateArtifactsCommand: artifactGenerationCommandSchema.optional(),
  artifactsPaths: z.union([z.string(), z.array(z.string()).min(1)]),
});

export type PluginArtifactOptions = z.infer<typeof pluginArtifactOptionsSchema>;
