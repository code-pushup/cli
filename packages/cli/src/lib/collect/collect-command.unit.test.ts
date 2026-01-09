import { describe, expect, it, vi } from 'vitest';
import { collectAndPersistReports, readRcByPath } from '@code-pushup/core';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type PersistConfig,
} from '@code-pushup/models';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants.js';
import { yargsCli } from '../yargs-cli.js';
import { yargsCollectCommandObject } from './collect-command.js';

vi.mock('@code-pushup/core', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/test-fixtures') =
    await vi.importActual('@code-pushup/test-fixtures');
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    collectAndPersistReports: vi.fn().mockResolvedValue({}),
    readRcByPath: vi.fn().mockResolvedValue(CORE_CONFIG_MOCK),
  };
});

describe('collect-command', () => {
  it('should call collect with default parameters', async () => {
    // It's hard to test the defaults for `config` so we skipped it as there are other integration tests already
    await yargsCli(['collect', '--config=/test/code-pushup.config.ts'], {
      ...DEFAULT_CLI_CONFIGURATION,
      commands: [yargsCollectCommandObject()],
    }).parseAsync();

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        config: '/test/code-pushup.config.ts',
        persist: expect.objectContaining<PersistConfig>({
          filename: DEFAULT_PERSIST_FILENAME,
          outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
          format: DEFAULT_PERSIST_FORMAT,
        }),
      }),
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

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

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

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        config: '/test/code-pushup.config.ts',
        plugins: [expect.objectContaining({ slug: 'cypress' })],
      }),
    );
  });

  it('should call collect only for the not skipped plugins', async () => {
    await yargsCli(
      [
        'collect',
        '--config=/test/code-pushup.config.ts',
        '--skipPlugins=cypress',
      ],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsCollectCommandObject()],
      },
    ).parseAsync();

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(collectAndPersistReports).toHaveBeenCalledWith(
      expect.objectContaining({
        config: '/test/code-pushup.config.ts',
        plugins: [expect.objectContaining({ slug: 'vitest' })],
      }),
    );
  });
});
