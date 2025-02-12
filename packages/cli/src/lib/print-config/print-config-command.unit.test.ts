import { describe, expect, vi } from 'vitest';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsConfigCommandObject } from './print-config-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('print-config-command', () => {
  it('should filter out meta arguments and kebab duplicates', async () => {
    await yargsCli(
      [
        'print-config',
        '--verbose',
        `--config=/test/code-pushup.config.ts`,
        '--persist.outputDir=destinationDir',
      ],
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsConfigCommandObject()] },
    ).parseAsync();

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
