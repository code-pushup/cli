import { bundleRequire } from 'bundle-require';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collectAndPersistReports } from '@code-pushup/core';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsCollectCommandObject } from './collect-command';

vi.mock('@code-pushup/core', async () => {
  const core = await vi.importActual('@code-pushup/core');
  return {
    ...(core as object),
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
  };
});

describe('collect-command', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'code-pushup.config.ts': '', // only needs to exist for stat inside readCodePushupConfig
      },
      '/test',
    );
  });

  it('should call collect with correct parameters', async () => {
    await yargsCli(
      [
        'collect',
        '--verbose',
        '--config=/test/code-pushup.config.ts',
        '--persist.filename=my-report',
        '--persist.outputDir=/test',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsCollectCommandObject()],
      },
    ).parseAsync();

    expect(bundleRequire).toHaveBeenCalledWith({
      format: 'esm',
      filepath: '/test/code-pushup.config.ts',
    });

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        verbose: true,
        config: '/test/code-pushup.config.ts',
        persist: expect.objectContaining({
          filename: 'my-report',
          outputDir: '/test',
        }),
      }),
    );
  });

  it('should call collect only for the specified plugin', async () => {
    await yargsCli(
      [
        'collect',
        '--config=/test/code-pushup.config.ts',
        '--onlyPlugins=cypress',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsCollectCommandObject()],
      },
    ).parseAsync();

    expect(bundleRequire).toHaveBeenCalledWith({
      format: 'esm',
      filepath: '/test/code-pushup.config.ts',
    });

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        config: '/test/code-pushup.config.ts',
        plugins: [expect.objectContaining({ slug: 'cypress' })],
      }),
    );
  });
});
