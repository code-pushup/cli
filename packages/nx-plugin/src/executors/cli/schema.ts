import { z } from 'zod';
import { persistConfigSchema, uploadConfigSchema } from '@code-pushup/models';

const commandSchema = z.enum([
  'collect',
  'upload',
  'autorun',
  'print-config',
  'compare',
  'merge-diffs',
] as const);

export const globalCliConfigSchema = z.object({
  verbose: z.boolean().optional().meta({ describe: 'Print additional logs' }),
  progress: z.boolean().optional().meta({ describe: 'Print additional logs' }),
  onlyPlugins: z
    .array(z.string())
    .optional()
    .meta({ describe: 'Only run the specified plugins' }),
  config: z
    .string()
    .optional()
    .meta({ describe: 'Path to the configuration file' }),
});

export const globalExecutorConfigSchema = z.object({
  command: commandSchema.optional().meta({ describe: 'The command to run.' }),
  dryRun: z.boolean().optional().meta({
    describe:
      "Print the commands that would be run, but don't actually run them",
  }),
  bin: z.string().optional().meta({ describe: 'Path to Code PushUp CLI' }),
  // removed in #1111
  projectPrefix: z
    .string()
    .optional()
    .meta({ describe: 'Prefix for project name' }),
});

export const printConfigOnlyExecutorConfigSchema = z.object({
  output: z
    .string()
    .optional()
    .meta({ describe: 'Config output path of print-config command' }),
});

export const autorunCommandExecutorOptionsSchema = z.object({
  // From globalExecutorConfigSchema
  command: commandSchema.optional().meta({ describe: 'The command to run.' }),
  dryRun: z.boolean().optional().meta({
    describe:
      "Print the commands that would be run, but don't actually run them",
  }),
  bin: z.string().optional().meta({ describe: 'Path to Code PushUp CLI' }),
  projectPrefix: z
    .string()
    .optional()
    .meta({ describe: 'Prefix for project name' }),

  // From printConfigOnlyExecutorConfigSchema
  output: z
    .string()
    .optional()
    .meta({ describe: 'Config output path of print-config command' }),

  // From globalCliConfigSchema
  verbose: z.boolean().optional().meta({ describe: 'Print additional logs' }),
  progress: z.boolean().optional().meta({ describe: 'Print additional logs' }),
  onlyPlugins: z
    .array(z.string())
    .optional()
    .meta({ describe: 'Only run the specified plugins' }),
  config: z
    .string()
    .optional()
    .meta({ describe: 'Path to the configuration file' }),

  // Additional options
  persist: persistConfigSchema
    .partial()
    .optional()
    .meta({ describe: 'Persist configuration' }),
  upload: uploadConfigSchema
    .partial()
    .optional()
    .meta({ describe: 'Upload configuration' }),
});

// Export the schema with the expected name for the zod-to-nx-schema tool
export const AutorunExecutorOptions = autorunCommandExecutorOptionsSchema;

export type AutorunCommandExecutorOptions = z.infer<
  typeof autorunCommandExecutorOptionsSchema
>;

export type GlobalCliConfig = z.infer<typeof globalCliConfigSchema>;
export type GlobalExecutorConfig = z.infer<typeof globalExecutorConfigSchema>;
export type PrintConfigOnlyExecutorConfig = z.infer<
  typeof printConfigOnlyExecutorConfigSchema
>;
export type AutorunCommandExecutorOnlyOptions = Pick<
  AutorunCommandExecutorOptions,
  'projectPrefix' | 'dryRun' | 'onlyPlugins'
>;

export type PrintConfigOptions = { output?: string };
export type PrintConfigCommandExecutorOptions = PrintConfigOptions;
