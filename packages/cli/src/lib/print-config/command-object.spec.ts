import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
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
      'code-pushup.config.ts',
    ),
  }),
];
const cli = (args: string[]) =>
  yargsCli(['config', ...args], {
    ...DEFAULT_CLI_CONFIGURATION,
    commands: [yargsConfigCommandObject()],
  });

describe('print-config-command-object', () => {
  it('should print existing config', async () => {
    const parsedArgv = await cli(baseArgs).parseAsync();
    expect(parsedArgv.persist.outputDir).toBe('tmp');
    expect(parsedArgv.persist.format).toEqual(undefined);
    expect(parsedArgv.upload?.organization).toEqual('code-pushup');
    expect(parsedArgv.upload?.project).toEqual('cli');
    expect(parsedArgv.upload?.apiKey).toEqual('dummy-api-key');
    expect(parsedArgv.upload?.server).toEqual('https://example.com/api');
    expect(parsedArgv.plugins).toEqual(expect.any(Array));
    expect(parsedArgv.plugins[0]?.slug).toEqual('sync-dummy-plugin');
    expect(parsedArgv.categories).toEqual(expect.any(Array));
  });

  it('should override config with CLI arguments', async () => {
    const overrides = {
      'persist.outputDir': 'custom/output/dir',
      'persist.format': ['md'],
      'upload.organization': 'custom-org',
      'upload.project': 'custom-project',
      'upload.apiKey': 'custom-api-key',
      'upload.server': 'https//custom-server.com/api',
    };
    const args = [...baseArgs, ...objectToCliArgs(overrides)];

    const parsedArgv = await cli(args).parseAsync();
    expect(parsedArgv.persist.outputDir).toBe(overrides['persist.outputDir']);
    expect(parsedArgv.persist.format).toEqual(overrides['persist.format']);
    expect(parsedArgv.upload?.organization).toEqual(
      overrides['upload.organization'],
    );
    expect(parsedArgv.upload?.project).toEqual(overrides['upload.project']);
    expect(parsedArgv.upload?.apiKey).toEqual(overrides['upload.apiKey']);
    expect(parsedArgv.upload?.server).toEqual(overrides['upload.server']);
    expect(parsedArgv.plugins).toEqual(expect.any(Array));
    expect(parsedArgv.plugins[0]?.slug).toEqual('sync-dummy-plugin');
    expect(parsedArgv.categories).toEqual(expect.any(Array));
  });
});
