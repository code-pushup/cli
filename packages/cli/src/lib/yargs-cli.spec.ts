import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { middlewares } from './middlewares';
import { options } from './options';
import { yargsCli } from './yargs-cli';

const demandCommand: [number, string] = [0, 'no command required'];

describe('yargsCli', () => {
  it('global options should provide correct defaults', async () => {
    const args: string[] = [];
    const parsedArgv = await yargsCli(args, {
      options,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.progress).toBe(true);
  });

  it('global options should parse correctly', async () => {
    const args: string[] = objectToCliArgs({
      verbose: true,
      progress: false,
    });

    const parsedArgv = await yargsCli(args, {
      options,
      demandCommand,
    }).parseAsync();
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.progress).toBe(false);
  });

  it('global options and middleware handle argument overrides correctly', async () => {
    const args: string[] = objectToCliArgs({
      config: join(
        fileURLToPath(dirname(import.meta.url)),
        '..',
        '..',
        'test',
        'code-pushup.config.ts',
      ),
      verbose: true,
      progress: false,
      format: ['md'],
    });
    const parsedArgv = await yargsCli(args, {
      options,
      middlewares,
    }).parseAsync();
    expect(parsedArgv.config).toContain('');
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.progress).toBe(false);
  });
});
