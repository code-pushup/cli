import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CollectAndPersistReportsOptions } from '@code-pushup/core';
import { reportFileName } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { mockConsole, unmockConsole } from '../../../test';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsCollectCommandObject } from './command-object';

const getFilename = () => reportFileName({ date: new Date().toISOString() });
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
let logs = [];

describe('collect-command-object', () => {
  beforeEach(() => {
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
