import { beforeAll, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { ui } from '@code-pushup/utils';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('print-config-command', () => {
  beforeAll(() => {
    // initialize it in raw mode
    ui().switchMode('raw');
  });

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
