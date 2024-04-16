import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../../internal/config';
import { createCliCommand } from '../internal/cli';
import { normalizeContext } from '../internal/context';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutorOptions } from './schema';

export default async function runExecutor(
  options: AutorunCommandExecutorOptions,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);

  const { projectPrefix, dryRun, ...cliOptions } = options;

  const cliArgumentObject = {
    ...globalConfig(cliOptions),
    persist: persistConfig(cliOptions.persist ?? {}, normalizedContext),
    upload: await uploadConfig(
      { projectPrefix, ...cliOptions.upload },
      normalizedContext,
    ),
  };

  const command = createCliCommand(AUTORUN_COMMAND, cliArgumentObject);

  if (dryRun) {
    logger.warn(`DryRun execution of: ${command}`);
  } else {
    // eslint-disable-next-line n/no-sync
    execSync(command, context.cwd ? { cwd: context.cwd } : {});
  }

  return {
    success: true,
    command,
  };
}
