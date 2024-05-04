import chalk from 'chalk';
import { z } from 'zod';
import { filePathSchema } from '@code-pushup/models';

export const customReporterOptionsSchema = z.object({
  outputFile: filePathSchema.optional(),
  rawOutputFile: filePathSchema.optional(),
});

export type CustomReporterOptions = z.infer<typeof customReporterOptionsSchema>;

export function parseCustomReporterOptions(
  optionsString?: string,
): CustomReporterOptions {
  // eslint-disable-next-line functional/no-let
  let rawJson;
  try {
    rawJson =
      typeof optionsString === 'string' && optionsString !== ''
        ? (JSON.parse(optionsString) as Record<string, unknown>)
        : {};
  } catch (error) {
    throw new Error(`The passed knip reporter options have to be a JSON parseable string. E.g. --reporter-options='{\\"prop\\":42}'
    Option string: ${chalk.bold(optionsString)}
    Error: ${(error as Error).message}`);
  }

  try {
    return customReporterOptionsSchema.parse(rawJson);
  } catch (error) {
    throw new Error(`The reporter options options have to follow the schema.'
    Error: ${(error as Error).message}`);
  }
}
