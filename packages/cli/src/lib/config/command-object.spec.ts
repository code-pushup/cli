import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { mockConsole, unmockConsole } from '../../../test/console.mock';
import { middlewares } from '../middlewares';
import { options } from '../options';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './command-object';

const baseArgs = [
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'config.mock.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['config', ...args], {
    options,
    middlewares,
    commands: [yargsConfigCommandObject()],
  });

let logs: string[] = [];

describe('config-command-object', () => {
  beforeEach(async () => {
    logs = [];
    mockConsole(msg => {
      const cleanMsg = msg.replace(
        /(\\"config\\\\": \\\\".*?\\\\")/m,
        `\\"config\\": \\"XXX\\"`,
      );
      logs.push(cleanMsg);
    });
  });
  afterEach(() => {
    logs = [];
    unmockConsole();
  });

  it('should override config with CLI arguments', async () => {
    const args = [
      ...baseArgs,
      ...objectToCliArgs({
        format: 'md',
      }),
    ];
    const parsedArgv = await cli(args).parseAsync();
    expect(parsedArgv.persist.outputDir).toBe('tmp');
    expect(parsedArgv.persist?.format).toEqual(['md']);
    expect(logs[0]).toMatchSnapshot();
  });
});
