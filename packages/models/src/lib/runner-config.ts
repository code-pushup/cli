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
    outputFile: filePathSchema.describe('Output path'),
    outputTransform: outputTransformSchema.optional(),
  },
  {
    description: 'How to execute runner',
  },
);

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const onProgressSchema = z
  .function()
  .args(z.unknown())
  .returns(z.void());
export type OnProgress = z.infer<typeof onProgressSchema>;

export const runnerFunctionSchema = z
  .function()
  .args(onProgressSchema.optional())
  .returns(z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]));

export type RunnerFunction = z.infer<typeof runnerFunctionSchema>;
