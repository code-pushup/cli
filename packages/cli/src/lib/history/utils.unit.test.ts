import { describe, expect, vi } from 'vitest';
import type { HistoryOptions } from '@code-pushup/core';
import type { HistoryCliOptions } from './history.model.js';
import { normalizeHashOptions } from './utils.js';

vi.mock('simple-git', async () => {
  const actual = await vi.importActual('simple-git');
  const orderedTagsHistory = ['2.0.0', '1.0.0'];
  return {
    ...actual,
    simpleGit: () => ({
      branch: () => Promise.resolve('dummy'),
      raw: () => Promise.resolve('main'),
      tag: () => Promise.resolve(orderedTagsHistory.join('\n')),
      show: ([_, __, tag]: string) =>
        orderedTagsHistory.includes(tag || '')
          ? Promise.resolve(`${tag}\ncommit--release-v${tag}`)
          : Promise.reject('NOT FOUND TAG'),
      checkout: () => Promise.resolve(),
      log: ({ maxCount }: { maxCount: number } = { maxCount: 1 }) =>
        Promise.resolve({
          all: [
            { hash: 'commit-6' },
            { hash: 'commit-5' },
            { hash: `commit--release-v${orderedTagsHistory.at(0)}` },
            { hash: 'commit-3' },
            { hash: `commit--release-v${orderedTagsHistory.at(1)}` },
            { hash: 'commit-1' },
          ].slice(-maxCount),
        }),
    }),
  };
});

describe('normalizeHashOptions', () => {
  it('should forwards other options', async () => {
    await expect(
      normalizeHashOptions({
        test: 42,
      } as unknown as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        test: 42,
      }),
    );
  });

  it('should set "maxCount" to undefined if "0" is passed', async () => {
    await expect(
      normalizeHashOptions({ maxCount: 0 } as HistoryCliOptions &
        HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        maxCount: undefined,
      }),
    );
  });

  it('should forward hashes "from" and "to" as is if "onlySemverTags" is false', async () => {
    await expect(
      normalizeHashOptions({
        from: 'commit-3',
        to: 'commit-1',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        from: 'commit-3',
        to: 'commit-1',
      }),
    );
  });

  it('should transform tags "from" and "to" to commit hashes if "onlySemverTags" is false', async () => {
    await expect(
      normalizeHashOptions({
        onlySemverTags: false,
        from: '2.0.0',
        to: '1.0.0',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        onlySemverTags: false,
        from: 'commit--release-v2.0.0',
        to: 'commit--release-v1.0.0',
      }),
    );
  });

  it('should forward tags "from" and "to" if "onlySemverTags" is true', async () => {
    await expect(
      normalizeHashOptions({
        onlySemverTags: true,
        from: '2.0.0',
        to: '1.0.0',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        onlySemverTags: true,
        from: '2.0.0',
        to: '1.0.0',
      }),
    );
  });

  it('should forward hashes "from" and "to" if "onlySemverTags" is true', async () => {
    await expect(
      normalizeHashOptions({
        onlySemverTags: true,
        from: 'commit-3',
        to: 'commit-1',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        onlySemverTags: true,
        from: 'commit-3',
        to: 'commit-1',
      }),
    );
  });
});
