import {z} from "zod";

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

export const executorSchema = globalOptionsSchema
 .merge(executorOnlySchema)


// @TODO add RunCommandOptions
export type AutorunCommandExecutor = z.infer<typeof executorSchema>;
export default executorSchema;
