import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsHistoryCommandObject } from './command-object';

const baseArgs = [
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'all-values.config.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['config', ...args], {
    ...DEFAULT_CLI_CONFIGURATION,
    commands: [yargsHistoryCommandObject()],
  });

describe('history-command-object', () => {
  it('should print existing config', async () => {
    const parsedArgv = await cli(baseArgs).parseAsync();
    expect(parsedArgv).toBe('tmp');
  });
});
