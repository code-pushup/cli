import { z } from 'zod';
import { filePathSchema } from './implementation/schemas';
import { auditOutputsSchema } from './plugin-process-output';

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
    outputFile: filePathSchema('Output path'),
    outputTransform: outputTransformSchema.optional(),
  },
  {
    description: 'How to execute runner',
  },
);

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const esmObserver = z.object({
  next: z.function().args(z.unknown()).returns(z.void()).optional(),
});
export type EsmObserver = z.infer<typeof esmObserver>;

export const esmRunnerConfigSchema = z
  .function()
  .args(esmObserver.optional())
  .returns(z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]));

export type EsmRunnerConfig = z.infer<typeof esmRunnerConfigSchema>;
