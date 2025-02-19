import { z } from 'zod';
import { auditOutputsSchema } from './audit-output.js';
import { filePathSchema } from './implementation/schemas.js';

export const outputTransformSchema = z
  .function()
  .args(z.unknown())
  .returns(z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]));

export type OutputTransform = z.infer<typeof outputTransformSchema>;

export const runnerConfigSchema = z.object(
  {
    command: z.string({
      description: 'Shell command to execute',
    }),
    args: z.array(z.string({ description: 'Command arguments' })).optional(),
    outputFile: filePathSchema.describe('Runner output path'),
    outputTransform: outputTransformSchema.optional(),
    configFile: filePathSchema.describe('Runner config path').optional(),
  },
  {
    description: 'How to execute runner',
  },
);

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const onProgressSchema = z.function().args(z.string()).returns(z.void());

export const runnerFunctionSchema = z
  .function()
  .args(z.void())
  .returns(z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]));

export type RunnerFunction = z.infer<typeof runnerFunctionSchema>;

export const runnerFilesPathsSchema = z.object({
  runnerConfigPath: filePathSchema.describe('Runner config path'),
  runnerOutputPath: filePathSchema.describe('Runner output path'),
});

export type RunnerFilesPaths = z.infer<typeof runnerFilesPathsSchema>;
