import { vol } from 'memfs';
import { SpyInstance, describe, expect } from 'vitest';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsConfigCommandObject } from './print-config-command';

// Mock file system API's
vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

// Mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
  return {
    bundleRequire: vi
      .fn()
      .mockResolvedValue({ mod: { default: CORE_CONFIG_MOCK } }),
  };
});

describe('print-config-command', () => {
  let logSpy: SpyInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, 'log');
    vol.reset();
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  afterEach(() => {
    logSpy.mockRestore();
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
