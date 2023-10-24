import { describe, expect, it } from 'vitest';
import { Options } from 'yargs';
import { objectToCliArgs } from '@code-pushup/utils';
import { yargsCli } from './yargs-cli';

const options: Record<string, Options> = {
  verbose: {
    describe: 'more info.',
    type: 'boolean',
    default: false,
  },
};
const demandCommand: [number, string] = [0, 'no command required'];
function middleware<T extends Record<string, unknown>>(processArgs: T) {
  return {
    ...processArgs,
    config: '42',
  };
}

describe('yargsCli', () => {
  it('global options should provide correct defaults', async () => {
    const args: string[] = [];
    const parsedArgv = await yargsCli(args, {
      options,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(false);
  });

  it('global options should parse correctly', async () => {
    const args: string[] = objectToCliArgs({
      verbose: true,
    });

    const parsedArgv = await yargsCli(args, {
      options,
      demandCommand,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(true);
  });

  it('global options and middleware handle argument overrides correctly', async () => {
    const args: string[] = objectToCliArgs({
      config: 'validConfigPath',
      verbose: true,
      format: ['md'],
    });
    const parsedArgv = await yargsCli(args, {
      options,
      demandCommand,
      middlewares: [
        {
          middlewareFunction: middleware,
        },
      ],
    }).parseAsync();
    expect(parsedArgv.config).toContain(42);
  });
});
