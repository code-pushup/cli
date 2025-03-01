import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsPrintConfigCommandObject } from './print-config-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    autoloadRc: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('print-config-command', () => {
  it('should log config to stdout by default', async () => {
    await yargsCli(['print-config'], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsPrintConfigCommandObject()],
    }).parseAsync();

    expect(ui()).toHaveLogged('log', expect.stringContaining('"plugins": ['));
  });

  it('should write config to file if output option is given', async () => {
    const outputPath = path.join(MEMFS_VOLUME, 'config.json');
    await yargsCli(['print-config', `--output=${outputPath}`], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsPrintConfigCommandObject()],
    }).parseAsync();

    await expect(readFile(outputPath, 'utf8')).resolves.toContain(
      '"plugins": [',
    );
    expect(ui()).not.toHaveLogged(
      'log',
      expect.stringContaining('"plugins": ['),
    );
    expect(ui()).toHaveLogged('info', `Config printed to file ${outputPath}`);
  });

  it('should filter out meta arguments and kebab duplicates', async () => {
    await yargsCli(['print-config', '--persist.outputDir=destinationDir'], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsPrintConfigCommandObject()],
    }).parseAsync();

    expect(ui()).not.toHaveLogged('log', expect.stringContaining('"$0":'));
    expect(ui()).not.toHaveLogged('log', expect.stringContaining('"_":'));

    expect(ui()).toHaveLogged(
      'log',
      expect.stringContaining('"outputDir": "destinationDir"'),
    );
    expect(ui()).not.toHaveLogged(
      'log',
      expect.stringContaining('"output-dir":'),
    );
  });
});
