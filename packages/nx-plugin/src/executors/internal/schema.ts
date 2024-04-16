import { z } from 'zod';

const globalExecutorOnlySchema = z.object({
  dryRun: z
    .boolean()
    .describe("Don't execute, just print the produced command")
    .optional(),
});
const globalCliOptionsSchema = z.object({
  progress: z.boolean().describe('show progress').optional(),
  verbose: z.boolean().describe('additional information').optional(),
});

// @TODO add RunCommandOptions
export const baseExecutorSchema = globalCliOptionsSchema.merge(
  globalExecutorOnlySchema,
);
export type GlobalCommandExecutor = z.infer<typeof baseExecutorSchema>;

export const uploadOnlySchema = z.object({
  projectPrefix: z
    .string()
    .describe(
      "Prefix the project name under upload configuration. A '-' is appended automatically E.g. 'cp' => 'cp-<project>'",
    )
    .optional(),
});
export type ExecutorUploadOptions = z.infer<typeof uploadOnlySchema>;
