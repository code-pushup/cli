import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SpyInstance, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../test/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

describe('print-config-command', () => {
  let logSpy: SpyInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should filter out meta arguments and kebab duplicates', async () => {
    const configPath = join(
      fileURLToPath(dirname(import.meta.url)),
      '..',
      '..',
      '..',
      'test',
      'all-values.config.ts',
    );
    await yargsCli(
      [
        'print-config',
        '--verbose',
        `--config=${configPath}`,
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
