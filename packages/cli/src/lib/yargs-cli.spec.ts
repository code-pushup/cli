import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { yargsCli } from './yargs-cli';
import { getDirname } from './implementation/helper.mock';
import { middlewares } from './middlewares';
import { GlobalOptions } from './model';
import { options as defaultOptions } from './options';
import { CoreConfig } from '@code-pushup/models';

const __dirname = getDirname(import.meta.url);
const withDirName = (path: string) => join(__dirname, path);
const validConfigPath = withDirName('implementation/mock/cli-config.mock.js');

const options = defaultOptions;
const demandCommand: [number, string] = [0, 'no command required'];

describe('yargsCli', () => {
  it('options should provide correct defaults', async () => {
    const args: string[] = [];
    const parsedArgv = yargsCli(args, {
      options,
      demandCommand,
    }).argv as unknown as GlobalOptions;
    expect(parsedArgv.configPath).toContain('code-pushup.config.js');
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.interactive).toBe(true);
  });

  it('options should parse correctly', async () => {
    const args: string[] = [
      '--verbose',
      '--no-interactive',
      '--configPath',
      validConfigPath,
    ];

    const parsedArgv = yargsCli(args, {
      options,
      demandCommand,
    }).argv as unknown as GlobalOptions & CoreConfig;
    expect(parsedArgv.configPath).toContain(validConfigPath);
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.interactive).toBe(false);
  });

  it('middleware should use config correctly', async () => {
    const args: string[] = ['--configPath', validConfigPath];
    const parsedArgv = (await yargsCli(args, {
      demandCommand,
      middlewares,
    }).argv) as unknown as GlobalOptions & CoreConfig;
    expect(parsedArgv.upload?.project).toContain('cli');
    expect(parsedArgv.persist.outputPath).toContain('cli-config-out.json');
  });

  it('middleware should lag error', async () => {
    // @TODO
  });

  it('command should receive args through middleware', async () => {
    // @TODO
  });

  it('command should lag error', async () => {
    // @TODO
  });

});
