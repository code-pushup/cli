import { join } from 'node:path';
import { pluginWorkDir } from '@code-pushup/utils';

export const WORKDIR = pluginWorkDir('coverage');
export const RUNNER_OUTPUT_PATH = join(WORKDIR, 'runner-output.json');
export const PLUGIN_CONFIG_PATH = join(
  process.cwd(),
  WORKDIR,
  'plugin-config.json',
);

export const INVALID_FUNCTION_NAME = '(empty-report)';
