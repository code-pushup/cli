import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterEach } from 'vitest';
import { CollectAndPersistReportsOptions } from '@code-pushup/core';
import { objectToCliArgs } from '@code-pushup/utils';
import { cleanFolderPutGitKeep } from '../../../test';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsCollectCommandObject } from './command-object';

const baseArgs = [
  ...objectToCliArgs({
    progress: false,
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'code-pushup.config.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['collect', ...args], {
    ...DEFAULT_CLI_CONFIGURATION,
    commands: [yargsCollectCommandObject()],
  });

describe('collect-command-object', () => {
  beforeEach(() => {
    cleanFolderPutGitKeep();
  });
  afterEach(() => {
    cleanFolderPutGitKeep();
  });

  it('should override config with CLI arguments', async () => {
    const args = [
      ...baseArgs,
      ...objectToCliArgs({
        'persist.format': 'md',
      }),
    ];
    const parsedArgv = (await cli(
      args,
    ).parseAsync()) as CollectAndPersistReportsOptions;
    expect(parsedArgv.persist.outputDir).toBe('tmp');
    expect(parsedArgv.persist.format).toEqual(['md']);
  });
});
