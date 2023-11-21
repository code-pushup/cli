import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect } from 'vitest';
import { objectToCliArgs } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

const baseArgs = [
  ...objectToCliArgs({
    verbose: true,
    config: join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'all-values.config.ts',
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
    expect(parsedArgv.persist.filename).toBe('report');
    expect(parsedArgv.persist.format).toBeUndefined();
    expect(parsedArgv.upload?.organization).toBe('code-pushup');
    expect(parsedArgv.upload?.project).toBe('cli');
    expect(parsedArgv.upload?.apiKey).toBe('dummy-api-key');
    expect(parsedArgv.upload?.server).toBe('https://example.com/api');
    expect(parsedArgv.plugins).toEqual(expect.any(Array));
    expect(parsedArgv.plugins[0]?.slug).toBe('plugin-1');
    expect(parsedArgv.categories).toEqual(expect.any(Array));
  });

  it('should override config with CLI arguments', async () => {
    const overrides = {
      'persist.outputDir': 'custom/output/dir',
      'persist.format': ['md'],
      'persist.filename': 'custom-report-filename',
      'upload.organization': 'custom-org',
      'upload.project': 'custom-project',
      'upload.apiKey': 'custom-api-key',
      'upload.server': 'https//custom-server.com/api',
    };
    const args = [...baseArgs, ...objectToCliArgs(overrides)];

    const parsedArgv = await cli(args).parseAsync();
    expect(parsedArgv.persist.outputDir).toBe(overrides['persist.outputDir']);
    expect(parsedArgv.persist.filename).toBe('custom-report-filename');
    expect(parsedArgv.persist.format).toEqual(overrides['persist.format']);
    expect(parsedArgv.upload?.organization).toEqual(
      overrides['upload.organization'],
    );
    expect(parsedArgv.upload?.project).toEqual(overrides['upload.project']);
    expect(parsedArgv.upload?.apiKey).toEqual(overrides['upload.apiKey']);
    expect(parsedArgv.upload?.server).toEqual(overrides['upload.server']);
    expect(parsedArgv.plugins).toEqual(expect.any(Array));
    expect(parsedArgv.plugins[0]?.slug).toBe('plugin-1');
    expect(parsedArgv.categories).toEqual(expect.any(Array));
  });
});
