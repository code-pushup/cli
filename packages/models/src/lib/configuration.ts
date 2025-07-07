import { z } from 'zod';

/**
 * Generic schema for a tool command configuration, reusable across plugins.
 */
export const toolCommandSchema = z.object({
  command: z.string({ description: 'Command to run the tool.' }).min(1),
  args: z
    .array(z.string(), {
      description: 'Arguments to be passed to the tool.',
    })
    .optional(),
});

export type ToolCommandConfig = z.infer<typeof toolCommandSchema>;
