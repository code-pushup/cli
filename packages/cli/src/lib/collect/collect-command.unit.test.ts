import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CollectAndPersistReportsOptions } from '@code-pushup/core';
import { objectToCliArgs } from '@code-pushup/utils';
import { mockConsole, unmockConsole } from '../../../test';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsCollectCommandObject } from './collect-command';

const getFilename = () => 'report';
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
      'minimal.config.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['collect', ...args], {
    ...DEFAULT_CLI_CONFIGURATION,
    commands: [yargsCollectCommandObject()],
  });

describe('collect-command-object', () => {
  let logs: unknown[];

  beforeEach(() => {
    logs = [];
    mockConsole((...args: unknown[]) => {
      logs.push(...args);
    });
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('should override config with CLI arguments', async () => {
    const filename = getFilename();
    const args = [
      ...baseArgs,
      ...objectToCliArgs({
        'persist.format': 'md',
        'persist.filename': filename,
      }),
    ];
    const parsedArgv = (await cli(
      args,
    ).parseAsync()) as CollectAndPersistReportsOptions;
    expect(parsedArgv.persist.outputDir).toBe('tmp');
    expect(parsedArgv.persist.format).toEqual(['md']);
  });
});
