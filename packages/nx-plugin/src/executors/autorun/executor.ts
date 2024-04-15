import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import {
  globalConfig,
  persistConfig,
  uploadConfig,
} from '../../internal/config';
import { objectToCliArgs } from './cli';
import { AUTORUN_COMMAND } from './constants';
import { AutorunCommandExecutor } from './schema';
import { normalizeContext } from './utils';

export default async function runExecutor(
  options: AutorunCommandExecutor,
  context: ExecutorContext,
) {
  const normalizedContext = normalizeContext(context);

  const { projectPrefix, dryRun, ...cliOptions } = options as any;

  const cliArgumentObject = {
    ...globalConfig(cliOptions),
    persist: persistConfig(cliOptions.persist ?? {}, normalizedContext),
    upload: await uploadConfig(
      { projectPrefix, ...cliOptions.upload },
      normalizedContext,
    ),
  };

  const command = `npx @code-pushup/cli ${AUTORUN_COMMAND} ${objectToCliArgs(
    cliArgumentObject,
  ).join(' ')}`;
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
