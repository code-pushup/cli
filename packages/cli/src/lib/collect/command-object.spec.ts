import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { objectToCliArgs } from '@code-pushup/utils';
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
      'test',
      'config.mock.ts',
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
  });
});
