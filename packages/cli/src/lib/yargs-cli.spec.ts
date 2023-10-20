import { describe, expect, it } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { options } from './options';
import { yargsCli } from './yargs-cli';

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
