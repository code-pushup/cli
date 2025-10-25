import { z } from 'zod';
import { globPathSchema } from './implementation/schemas.js';

/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const artifactGenerationCommandSchema = z
  .union([
    z.string().min(1).meta({ description: 'Generate artifact files' }),
    z.object({
      command: z
        .string()
        .min(1)
        .meta({ description: 'Generate artifact files' }),
      args: z.array(z.string()).optional(),
    }),
  ])
  .meta({ title: 'ArtifactGenerationCommand' });

export const pluginArtifactOptionsSchema = z
  .object({
    generateArtifactsCommand: artifactGenerationCommandSchema.optional(),
    artifactsPaths: z
      .union([globPathSchema, z.array(globPathSchema).min(1)])
      .meta({ description: 'File paths or glob patterns for artifact files' }),
  })
  .meta({ title: 'PluginArtifactOptions' });

export type PluginArtifactOptions = z.infer<typeof pluginArtifactOptionsSchema>;
