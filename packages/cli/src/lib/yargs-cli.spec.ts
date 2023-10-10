import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { yargsCli } from './yargs-cli';
import { getDirname } from './implementation/helper.mock';
import { middlewares } from './middlewares';
import { GlobalOptions } from './model';
import { options as defaultOptions } from './options';
import { CoreConfig } from '@code-pushup/models';
import { objectToCliArgs } from '@code-pushup/utils';
import { ArgsCliObj } from './implementation/model';

const __dirname = getDirname(import.meta.url);
const withDirName = (path: string) => join(__dirname, path);
const validConfigPath = withDirName('implementation/mock/cli-config.mock.js');

const options = defaultOptions;
const demandCommand: [number, string] = [0, 'no command required'];

describe('yargsCli', () => {
  it('global options should provide correct defaults', async () => {
    const args: string[] = [];
    const parsedArgv = yargsCli(args, {
      options,
      demandCommand,
    }).argv as unknown as GlobalOptions;
    expect(parsedArgv.configPath).toContain('code-pushup.config.js');
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.interactive).toBe(true);
  });

  it('global options should parse correctly', async () => {
    const args: string[] = objectToCliArgs({
      verbose: true,
      interactive: false,
      configPath: validConfigPath,
      format: ['md'],
    });

    const parsedArgv = yargsCli(args, {
      options,
      demandCommand,
    }).argv as unknown as GlobalOptions & ArgsCliObj;
    expect(parsedArgv.configPath).toContain(validConfigPath);
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.interactive).toBe(false);
    expect(parsedArgv?.format).toEqual(['md']);
  });

  it('global middleware should use config correctly', async () => {
    const args: string[] = objectToCliArgs({
      configPath: validConfigPath,
    });
    const parsedArgv = (await yargsCli(args, {
      demandCommand,
      middlewares,
    }).argv) as unknown as GlobalOptions & CoreConfig;
    expect(parsedArgv.upload?.project).toContain('cli');
    expect(parsedArgv.persist.outputPath).toContain('cli-config-out.json');
  });

  it('global options and middleware handle argument overrides correctly', async () => {
    const args: string[] = objectToCliArgs({
      configPath: validConfigPath,
      outputPath: 'tmpp',
      format: 'md',
    });
    const parsedArgv = (await yargsCli(args, {
      options,
      demandCommand,
      middlewares,
    }).parseAsync()) as unknown as GlobalOptions & CoreConfig;
    expect(parsedArgv.upload?.project).toContain('cli');
    expect(parsedArgv.upload?.organization).toContain('code-pushup');
    expect(parsedArgv.upload?.apiKey).toContain('dummy-api-key');
    expect(parsedArgv.upload?.server).toContain('https://example.com/api');
    expect(parsedArgv.persist.outputPath).toContain('tmpp');
    expect(parsedArgv.persist.format).toEqual(['md']);
  });
});
