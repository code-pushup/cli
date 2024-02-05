import { beforeAll, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { logger, ui } from '../implementation/logging';
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
    // initialize it inn raw mode
    ui({ mode: 'raw' });
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

    const log = logger().getLogs();
    expect(log).toEqual(
      expect.arrayContaining([
        {
          stream: 'stdout',
          message: expect.not.stringContaining('"$0":'),
        },
      ]),
    );
    expect(log).toEqual(
      expect.arrayContaining([
        {
          stream: 'stdout',
          message: expect.not.stringContaining('"_":'),
        },
      ]),
    );
    expect(log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stream: 'stdout',
          message: expect.stringContaining('"outputDir": "destinationDir"'),
        }),
      ]),
    );

    expect(log).toEqual(
      expect.arrayContaining([
        {
          stream: 'stdout',
          message: expect.not.stringContaining('"output-dir":'),
        },
      ]),
    );
  });
});
