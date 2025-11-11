import type { GlobalOptions } from '@code-pushup/core';
import type { CoreConfig } from '@code-pushup/models';
import { coerceBooleanValue, logger } from '@code-pushup/utils';
import type { FilterOptions } from './filter.model.js';
import type { GeneralCliOptions } from './global.model';

/**
 *
 * | CP_VERBOSE value | CLI `--verbose` flag | Effect |
 * |------------------|----------------------|--------|
 * | true             | -                    | true   |
 * | false            | -                    | false  |
 * | -                | -                    | false  |
 * | -                | true                 | true   |
 * | -                | false                | false  |
 * | true             | true                 | true   |
 * | false            | true                 | true   |
 * | true             | false                | false  |
 * | false            | false                | false  |
 *
 * @param originalProcessArgs
 */
export function setVerboseMiddleware<
  T extends GeneralCliOptions & CoreConfig & FilterOptions & GlobalOptions,
>(originalProcessArgs: T): T {
  const cliVerbose = coerceBooleanValue(originalProcessArgs.verbose);
  if (cliVerbose != null) {
    logger.setVerbose(cliVerbose);
  }

  return {
    ...originalProcessArgs,
    verbose: logger.isVerbose(),
  };
}
