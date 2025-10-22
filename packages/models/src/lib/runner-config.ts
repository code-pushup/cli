import { z } from 'zod/v4';
import { auditOutputsSchema } from './audit-output.js';
import { convertAsyncZodFunctionToSchema } from './implementation/function.js';
import { filePathSchema } from './implementation/schemas.js';
import { persistConfigSchema } from './persist-config.js';

export const outputTransformSchema = convertAsyncZodFunctionToSchema(
  z.function({
    input: [z.unknown()],
    output: z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]),
  }),
);
export type OutputTransform = z.infer<typeof outputTransformSchema>;

export const runnerArgsSchema = z
  .object({
    persist: persistConfigSchema
      .required()
      .meta({ description: 'Persist config with defaults applied' }),
  })
  .meta({ description: 'Arguments passed to runner' });
export type RunnerArgs = z.infer<typeof runnerArgsSchema>;

export const runnerConfigSchema = z
  .object({
    command: z.string().meta({ description: 'Shell command to execute' }),
    args: z
      .array(z.string())
      .meta({ description: 'Command arguments' })
      .optional(),
    outputFile: filePathSchema.meta({ description: 'Runner output path' }),
    outputTransform: outputTransformSchema.optional(),
    configFile: filePathSchema
      .meta({ description: 'Runner config path' })
      .optional(),
  })
  .meta({ description: 'How to execute runner using shell script' });
export type RunnerConfig = z.infer<typeof runnerConfigSchema>;

export const runnerFunctionSchema = convertAsyncZodFunctionToSchema(
  z.function({
    input: [runnerArgsSchema],
    output: z.union([auditOutputsSchema, z.promise(auditOutputsSchema)]),
  }),
).meta({
  description: 'Callback function for async runner execution in JS/TS',
});
export type RunnerFunction = z.infer<typeof runnerFunctionSchema>;

export const runnerFilesPathsSchema = z.object({
  runnerConfigPath: filePathSchema.meta({ description: 'Runner config path' }),
  runnerOutputPath: filePathSchema.meta({ description: 'Runner output path' }),
});
export type RunnerFilesPaths = z.infer<typeof runnerFilesPathsSchema>;
