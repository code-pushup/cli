import {describe, expect, it} from 'vitest';

import {existsSync} from 'fs';
import {yargsCli} from './cli';
import {join} from 'path';
import {yargsGlobalOptionsDefinition} from './options';
import {commands} from './commands';
import {middlewares} from './middlewares';

const withDirName = (path: string) => join(__dirname, path);
const validConfigPath = withDirName('mock/cli-config.mock.js');

const options = yargsGlobalOptionsDefinition();

describe('cli', () => {
  it('options should provide correct defaults', async () => {
    const args: string[] = [];
    const parsedArgv = yargsCli<any>({ options }).parse(args);
    expect(parsedArgv.configPath).toContain('cpu-config.js');
    expect(parsedArgv.verbose).toBe(false);
    expect(parsedArgv.interactive).toBe(true);
  });

  it('options should parse correctly', async () => {
    const args: any[] = [
      '--verbose',
      '--no-interactive',
      '--configPath',
      validConfigPath,
    ];

    const parsedArgv: any = yargsCli({ options }).parse(args);
    console.log('argv: ', parsedArgv);
    expect(parsedArgv.configPath).toContain(validConfigPath);
    expect(parsedArgv.verbose).toBe(true);
    expect(parsedArgv.interactive).toBe(false);
  });

  it('middleware should use config correctly', async () => {
    const args: any[] = ['--configPath', validConfigPath];
    const parsedArgv: any = await yargsCli({
      middlewares: middlewares as any,
    }).parseAsync(args);
    expect(parsedArgv.configPath).toContain('cli-config.mock.js');
    expect(parsedArgv.persist.outputPath).toContain('cli-config-out.json');
  });

  it('run commands should execute correctly', async () => {
    const args: any[] = ['run', '--configPath', validConfigPath];
    const parsedArgv: any = await yargsCli({
      commands: commands,
      middlewares: middlewares,
    }).parseAsync(args);
    expect(parsedArgv.configPath).toContain('cli-config.mock.js');
    expect(parsedArgv.persist.outputPath).toContain('cli-config-out.json');
    expect(existsSync(parsedArgv.persist.outputPath)).toBeTruthy();
  });
});
