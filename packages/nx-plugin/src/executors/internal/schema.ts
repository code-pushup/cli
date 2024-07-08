import { z } from 'zod';
import { globalCliOptionsSchema } from '../../internal/schema';

const globalExecutorOnlySchema = z.object({
  dryRun: z
    .boolean()
    .describe("Don't execute, just print the produced command")
    .optional(),
});

// @TODO add RunCommandOptions e.g. ???
export const baseExecutorSchema = globalCliOptionsSchema.merge(
  globalExecutorOnlySchema,
);

export type GlobalCommandExecutor = z.infer<typeof baseExecutorSchema>;

export const executorOptionsUploadOnlySchema = z.object({
  projectPrefix: z
    .string()
    .describe(
      "Prefix the project name under upload configuration. A '-' is appended automatically E.g. 'cp' => 'cp-<project>'",
    )
    .optional(),
});
export type ExecutorOptionsUploadOnly = z.infer<
  typeof executorOptionsUploadOnlySchema
>;
