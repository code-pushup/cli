import { describe, expect, vi } from 'vitest';
import { type HistoryOptions, history, readRcByPath } from '@code-pushup/core';
import { safeCheckout } from '@code-pushup/utils';
import { DEFAULT_CLI_CONFIGURATION } from '../../../mocks/constants';
import { yargsCli } from '../yargs-cli';
import { yargsHistoryCommandObject } from './history-command';

vi.mock('@code-pushup/core', async () => {
  const {
    MINIMAL_HISTORY_CONFIG_MOCK,
  }: typeof import('@code-pushup/test-utils') = await vi.importActual(
    '@code-pushup/test-utils',
  );
  const core: object = await vi.importActual('@code-pushup/core');
  return {
    ...core,
    history: vi
      .fn()
      .mockImplementation((options: HistoryOptions, commits: string[]) =>
        commits.map(commit => `${commit}-report.json`),
      ),
    readRcByPath: vi.fn().mockResolvedValue(MINIMAL_HISTORY_CONFIG_MOCK),
  };
});

vi.mock('@code-pushup/utils', async () => {
  const utils: object = await vi.importActual('@code-pushup/utils');
  return {
    ...utils,
    safeCheckout: vi.fn(),
    getCurrentBranchOrTag: vi.fn().mockReturnValue('main'),
  };
});

vi.mock('simple-git', async () => {
  const actual = await vi.importActual('simple-git');
  return {
    ...actual,
    simpleGit: () => ({
      log: ({ maxCount }: { maxCount: number } = { maxCount: 1 }) =>
        Promise.resolve({
          all: [
            { hash: 'commit-3' },
            { hash: 'commit-2' },
            { hash: 'commit-1' },
          ].slice(-maxCount),
        }),
    }),
  };
});

describe('history-command', () => {
  it('should have correct default arguments if no cli options are provided', async () => {
    const result = await yargsCli(
      ['history', '--config=/test/code-pushup.config.ts'],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsHistoryCommandObject()],
      },
    ).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        onlyPlugins: [],
        targetBranch: 'main',
        maxCount: 1,
        skipUploads: true,
      }),
    );

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(history).toHaveBeenCalledWith(
      expect.objectContaining({
        targetBranch: 'main',
      }),
      ['commit-1'],
    );

    expect(safeCheckout).toHaveBeenCalledTimes(1);
  });

  it('should have 2 commits to crawl in history if maxCount is set to 2', async () => {
    const result = await yargsCli(
      ['history', '--config=/test/code-pushup.config.ts', '--maxCount=2'],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsHistoryCommandObject()],
      },
    ).parseAsync();

    expect(result).toEqual(
      expect.objectContaining({
        targetBranch: 'main',
        maxCount: 2,
        skipUploads: true,
      }),
    );

    expect(readRcByPath).toHaveBeenCalledWith(
      '/test/code-pushup.config.ts',
      undefined,
    );

    expect(history).toHaveBeenCalledWith(expect.any(Object), [
      'commit-1',
      'commit-2',
    ]);

    expect(safeCheckout).toHaveBeenCalledTimes(1);
  });
});