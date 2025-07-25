import { z } from 'zod';

export const commandSchema = z
  .string({ description: 'Generate artifact files' })
  .min(1);
export type Command = z.infer<typeof commandSchema>;

export const commandObjectSchema = z.object({
  command: z.string({ description: 'Generate artifact files' }).min(1),
  args: z.array(z.string()).optional(),
});
export type CommandObject = z.infer<typeof commandObjectSchema>;
/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const artifactGenerationCommandSchema = z.union([
  commandSchema,
  commandObjectSchema,
]);

export type ArtifactGenerationCommand = z.infer<
  typeof artifactGenerationCommandSchema
>;

export const pluginArtifactOptionsSchema = z.object({
  generateArtifactsCommand: artifactGenerationCommandSchema.optional(),
  artifactsPaths: z.union([z.string(), z.array(z.string()).min(1)]),
});

export type PluginArtifactOptions = z.infer<typeof pluginArtifactOptionsSchema>;
