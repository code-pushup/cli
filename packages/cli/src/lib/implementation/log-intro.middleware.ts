import ansis from 'ansis';
import type { ArgumentsCamelCase } from 'yargs';
import { CODE_PUSHUP_UNICODE_LOGO, logger } from '@code-pushup/utils';
import { CLI_DISPLAY_NAME } from '../constants.js';
import { getVersion } from './version.js';

export function logIntroMiddleware(
  args: ArgumentsCamelCase,
): ArgumentsCamelCase {
  logger.info(
    ansis.bold.blue(
      `${CODE_PUSHUP_UNICODE_LOGO} ${CLI_DISPLAY_NAME} v${getVersion()}`,
    ),
  );
  return args;
}
