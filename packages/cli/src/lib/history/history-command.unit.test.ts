import { describe, expect, vi } from 'vitest';
import { type HistoryOptions, history } from '@code-pushup/core';
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
      branch: () => Promise.resolve('dummy'),
      raw: () => Promise.resolve('main'),
      tag: () => Promise.resolve(`5\n 4\n 3\n 2\n 1`),
      show: ([_, __, tag]: string) =>
        Promise.resolve(`release v${tag}\n ${tag}`),
      checkout: () => Promise.resolve(),
      log: ({ maxCount }: { maxCount: number } = { maxCount: 1 }) =>
        Promise.resolve({
          all: [
            { hash: 'commit-6' },
            { hash: 'commit-5' },
            { hash: 'commit-4--release-v2' },
            { hash: 'commit-3' },
            { hash: 'commit-2--release-v1' },
            { hash: 'commit-1' },
          ].slice(-maxCount),
        }),
    }),
  };
});

describe('history-command', () => {
  it.skip('should have 2 commits to crawl in history if maxCount is set to 2', async () => {
    await yargsCli(
      ['history', '--config=/test/code-pushup.config.ts', '--maxCount=2'],
      {
        ...DEFAULT_CLI_CONFIGURATION,
        commands: [yargsHistoryCommandObject()],
      },
    ).parseAsync();

    expect(history).toHaveBeenCalledWith(expect.any(Object), [
      'commit-1',
      'commit-2--release-v1',
    ]);

    expect(safeCheckout).toHaveBeenCalledTimes(1);
  });
});
