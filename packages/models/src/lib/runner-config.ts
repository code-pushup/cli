import { z } from 'zod/v4';
import { auditOutputsSchema } from './audit-output.js';
import { convertAsyncZodFunctionToSchema } from './implementation/function.js';
import { filePathSchema } from './implementation/schemas.js';

export const outputTransformSchema = convertAsyncZodFunctionToSchema(
  z.function({
    input: [z.unknown()],
    output: z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]),
  }),
);
export type OutputTransform = z.infer<typeof outputTransformSchema>;

export const runnerConfigSchema = z
  .object({
    command: z.string().describe('Shell command to execute'),
    args: z.array(z.string()).describe('Command arguments').optional(),
    outputFile: filePathSchema.describe('Runner output path'),
    outputTransform: outputTransformSchema.optional(),
    configFile: filePathSchema.describe('Runner config path').optional(),
  })
  .describe('How to execute runner');

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const runnerFunctionSchema = convertAsyncZodFunctionToSchema(
  z.function({
    output: z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]),
  }),
);

export type RunnerFunction = z.infer<typeof runnerFunctionSchema>;

export const runnerFilesPathsSchema = z.object({
  runnerConfigPath: filePathSchema.describe('Runner config path'),
  runnerOutputPath: filePathSchema.describe('Runner output path'),
});

export type RunnerFilesPaths = z.infer<typeof runnerFilesPathsSchema>;
