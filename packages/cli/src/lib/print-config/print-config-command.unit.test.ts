import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SpyInstance, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

describe('print-config-command', () => {
  let logSpy: SpyInstance;
  let cwdSpy: SpyInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
    cwdSpy = vi.spyOn(process, 'cwd');
    cwdSpy.mockReturnValue(
      join(
        fileURLToPath(dirname(import.meta.url)),
        '..',
        '..',
        '..',
        '..',
        '..',
        'testing-utils',
        'src',
        'lib',
        'fixtures',
        'configs',
      ),
    );
  });

  afterEach(() => {
    logSpy.mockRestore();
    cwdSpy.mockRestore();
  });

  it('should filter out meta arguments and kebab duplicates', async () => {
    await yargsCli(
      [
        'print-config',
        '--verbose',
        `--config=code-pushup.config.ts`,
        '--persist.outputDir=destinationDir',
      ],
      { ...DEFAULT_CLI_CONFIGURATION, commands: [yargsConfigCommandObject()] },
    ).parseAsync();

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('"$0":'));
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('"_":'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('"outputDir": "destinationDir"'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('"output-dir":'),
    );
  });
});
