import { z } from 'zod';
import { executionMetaSchema, filePathSchema } from './implementation/schemas';
import { AuditOutputs, auditOutputsSchema } from './plugin-process-output';

// @TODO add returns definition as AuditOutputs - this fails ATM when compiling
export const outputFileToAuditOutputsSchema = z.function().args(z.unknown());

// @TODO us z.infer<typeof outputTransformSchema>;
export type OutputFileToAuditOutputs = (d: unknown) => AuditOutputs;

export const runnerConfigSchema = z.object(
  {
    command: z.string({
      description: 'Shell command to execute',
    }),
    args: z.array(z.string({ description: 'Command arguments' })).optional(),
    outputFile: filePathSchema('Output path'),
    outputFileToAuditResults: outputFileToAuditOutputsSchema.optional(),
  },
  {
    description: 'How to execute runner',
  },
);

export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const runnerResultSchema = executionMetaSchema().merge(
  z.object(
    {
      audits: auditOutputsSchema,
    },
    {
      description: 'Shape for all versions of runner',
    },
  ),
);
export type RunnerResult = z.infer<typeof runnerResultSchema>;

export const esmObserver = z.object({
  next: z.function().args(z.unknown()).returns(z.void()),
});
export type EsmObserver = z.infer<typeof esmObserver>;

export const esmRunnerConfigSchema = z
  .function()
  .args(esmObserver.optional())
  .returns(z.promise(z.array(z.record(z.string(), z.unknown()))));

export type EsmRunnerConfig = z.infer<typeof esmRunnerConfigSchema>;
