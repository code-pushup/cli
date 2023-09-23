import { Options } from 'yargs';
import { z } from 'zod';
import { globalOptionsSchema } from '@quality-metrics/models';

/**
 * Regular expression to validate filenames for Windows and UNIX
 **/
export const generalFilePathRegex =
  /^(?:(?:[A-Za-z]:)?[\\/])?(?:\w[\w .-]*[\\/]?)*$/;

export const globalCliArgsSchema = globalOptionsSchema.merge(
  z.object({
    interactive: z
      .boolean({
        description:
          'flag if interactivity should be considered. Useful for CI runs.',
      })
      .default(true),
    verbose: z
      .boolean({
        description: 'Outputs additional information for a run',
      })
      .default(false),
    configPath: z
      .string({
        description:
          "Path to config file in format `ts` or `mjs`. defaults to 'code-pushup.config.js'",
      })
      .regex(generalFilePathRegex, {
        message: 'path to code-pushup.config.js is invalid',
      })
      .optional()
      .default('code-pushup.config.js'),
  }),
);

export type GlobalCliArgs = z.infer<typeof globalCliArgsSchema>;

export function yargsGlobalOptionsDefinition(): Record<
  keyof GlobalCliArgs,
  Options
> {
  return {
    interactive: {
      describe: 'When false disables interactive input prompts for options.',
      type: 'boolean',
      default: true,
    },
    verbose: {
      describe:
        'When true creates more verbose output. This is helpful when debugging.',
      type: 'boolean',
      default: false,
    },
    configPath: {
      describe: 'Path the the config file, e.g. code-pushup.config.js',
      type: 'string',
      default: 'code-pushup.config.js',
    },
  };
}
