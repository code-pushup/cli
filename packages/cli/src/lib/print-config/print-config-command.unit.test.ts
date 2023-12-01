import { vol } from 'memfs';
import { beforeEach, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

describe('print-config-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
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
