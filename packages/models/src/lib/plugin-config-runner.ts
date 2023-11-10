import { z } from 'zod';
import { filePathSchema } from './implementation/schemas';

export const outputTransformSchema = z
  .function()
  .args(z.array(z.record(z.string(), z.unknown())));
// @TODO add returns definition as AuditOutputs - this fails ATM when compiling

export type OutputTransform = z.infer<typeof outputTransformSchema>;

export const runnerConfigSchema = z.object(
  {
    command: z.string({
      description: 'Shell command to execute',
    }),
    args: z.array(z.string({ description: 'Command arguments' })).optional(),
    outputFile: filePathSchema('Output path'),
    transform: outputTransformSchema.optional(),
  },
  {
    description: 'How to execute runner',
  },
);

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;
