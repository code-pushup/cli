import { describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
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

    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining('"$0":'),
    );
    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining('"_":'),
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"outputDir": "destinationDir"'),
    );
    expect(console.info).not.toHaveBeenCalledWith(
      expect.stringContaining('"output-dir":'),
    );
  });
});
