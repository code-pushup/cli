import type { GlobalOptions } from '@code-pushup/core';
import type { CoreConfig } from '@code-pushup/models';
import type { FilterOptions } from './filter.model.js';
import type { GeneralCliOptions } from './global.model';

/**
 *
 * | CP_VERBOSE value | CLI `--verbose` flag        | Effect     |
 * |------------------|-----------------------------|------------|
 * | true             | Not provided                | enabled    |
 * | false            | Not provided                | disabled   |
 * | Not provided     | Not provided                | disabled   |
 * | Not provided     | Explicitly set (true)       | enabled    |
 * | true             | Explicitly set (true)       | enabled    |
 * | false            | Explicitly set (true)       | enabled    |
 * | true             | Explicitly negated (false)  | disabled   |
 * | false            | Explicitly negated (false)  | disabled   |
 *
 * @param originalProcessArgs
 */
export function setVerboseMiddleware<
  T extends GeneralCliOptions & CoreConfig & FilterOptions & GlobalOptions,
>(originalProcessArgs: T): T {
  const envVerbose = getNormalizedOptionValue(process.env['CP_VERBOSE']);
  const cliVerbose = getNormalizedOptionValue(originalProcessArgs.verbose);
  const verboseEffect = cliVerbose ?? envVerbose ?? false;

  // eslint-disable-next-line functional/immutable-data
  process.env['CP_VERBOSE'] = `${verboseEffect}`;

  return {
    ...originalProcessArgs,
    verbose: verboseEffect,
  };
}

export function getNormalizedOptionValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowerCaseValue = value.toLowerCase();
    if (lowerCaseValue === 'true') {
      return true;
    }
    if (lowerCaseValue === 'false') {
      return false;
    }
  }

  return undefined;
}
