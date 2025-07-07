import { z } from 'zod';

/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const artifactGenerationCommand = z.object({
  command: z.string({ description: 'Generate artefact files' }).min(1),
  args: z
    .array(z.string(), {
      description: 'Arguments to be passed to the artefact generation command.',
    })
    .optional(),
});

export type ArtefactGenerationCommand = z.infer<
  typeof artifactGenerationCommand
>;

export const pluginArtefactOptionsSchema = z.object({
  generateArtefacts: artifactGenerationCommand.optional(),
  artefactsPaths: z.union([z.string(), z.array(z.string())]),
});

export type PluginArtefactOptions = z.infer<typeof pluginArtefactOptionsSchema>;
