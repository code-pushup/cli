import { describe, expect, vi } from 'vitest';
import { ui } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-utils') =
    await vi.importActual('@code-pushup/test-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

vi.mock('@code-pushup/utils', async () => {
  const module = await vi.importActual('@code-pushup/utils');

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  module.ui().switchMode('raw');

  return module;
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

    const log = ui().logger.getLogs()[0];

    expect(log).toEqual(
      expect.objectContaining({
        message: expect.not.stringContaining('"$0":'),
      }),
    );

    expect(log).toEqual(
      expect.objectContaining({
        message: expect.not.stringContaining('"_":'),
      }),
    );

    expect(log).toEqual(
      expect.objectContaining({
        message: expect.stringContaining('"outputDir": "destinationDir"'),
      }),
    );

    expect(log).toEqual(
      expect.objectContaining({
        message: expect.not.stringContaining('"output-dir":'),
      }),
    );
  });
});
