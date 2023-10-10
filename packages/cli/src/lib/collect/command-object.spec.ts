import { yargsCli } from '../yargs-cli';
import { middlewares } from '../middlewares';
import { options } from '../options';
import { vi } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { yargsUploadCommandObject } from '../upload/command-object';

const baseArgs = [
  ...objectToCliArgs({
    verbose: true,
    configPath: join(fileURLToPath(dirname(import.meta.url)), 'config.mock.ts'),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['collect', ...args], {
    options,
    middlewares,
    commands: [yargsUploadCommandObject()],
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
    expect(parsedArgv.persist.outputPath).toBe('tmp');
    expect(parsedArgv.persist?.format).toEqual(['md']);
    expect(parsedArgv.upload?.project).toEqual('cli');
    expect(parsedArgv.upload?.organization).toBe('code-pushup');
    expect(parsedArgv.upload?.apiKey).toEqual('dummy-api-key');
    expect(parsedArgv.upload?.server).toEqual('https://example.com/api');
  });
});
