import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterEach } from 'vitest';
import { CollectAndPersistReportsOptions } from '@code-pushup/core';
import { objectToCliArgs } from '@code-pushup/utils';
import { cleanFolderPutGitKeep } from '../../../test';
import { middlewares } from '../middlewares';
import { options } from '../options';
import { yargsCli } from '../yargs-cli';
import { yargsCollectCommandObject } from './command-object';

const baseArgs = [
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      '..',
      'models',
      'test',
      'fixtures',
      'code-pushup.config.mock.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['collect', ...args], {
    options,
    middlewares,
    commands: [yargsCollectCommandObject()],
  });

describe('collect-command-object', () => {
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
