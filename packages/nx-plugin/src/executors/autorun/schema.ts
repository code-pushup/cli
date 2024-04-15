import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { persistConfigSchema } from '@code-pushup/models';

const executorOnlySchema = z.object({
  projectPrefix: z
    .string()
    .describe(
      "Prefix the project name under upload configuration. A '-' is appended automatically E.g. 'cp' => 'cp-<project>'",
    )
    .optional(),
  dryRun: z
    .boolean()
    .describe("Don't execute, just print the produced command")
    .optional(),
});
const globalOptionsSchema = z.object({
  progress: z.boolean().describe('show progress').optional(),
  verbose: z.boolean().describe('additional information').optional(),
});
const executorSchema = z
  .object({
    persist: z.optional(persistConfigSchema).optional(),
    // upload: persistConfigSchema.optional()
  })
  .merge(globalOptionsSchema)
  .merge(executorOnlySchema);

export type AutorunCommandExecutor = z.infer<typeof executorSchema>;
export default executorSchema;
