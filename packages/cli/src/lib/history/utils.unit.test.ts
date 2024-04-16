import { describe, expect, vi } from 'vitest';
import { type HistoryOptions } from '@code-pushup/core';
import { HistoryCliOptions } from './history.model';
import { normalizeHashOptions } from './utils';

vi.mock('simple-git', async () => {
  const actual = await vi.importActual('simple-git');
  return {
    ...actual,
    simpleGit: () => ({
      branch: () => Promise.resolve('dummy'),
      raw: () => Promise.resolve('main'),
      tag: () => Promise.resolve(`2\n1`),
      show: ([_, __, tag]: string) =>
        ['1', '2'].includes(tag || '')
          ? Promise.resolve(`${tag}\ncommit--release-v${tag}`)
          : Promise.reject('NOT FOUND TAG'),
      checkout: () => Promise.resolve(),
      log: ({ maxCount }: { maxCount: number } = { maxCount: 1 }) =>
        Promise.resolve({
          all: [
            { hash: 'commit-6' },
            { hash: 'commit-5' },
            { hash: 'commit--release-v2' },
            { hash: 'commit-3' },
            { hash: 'commit--release-v1' },
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

  it('should forward hashes "from" and "to" as is if "semverTag" is false', async () => {
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

  it('should transform tags "form" and "to" to commit hashes if "semverTag" is false', async () => {
    await expect(
      normalizeHashOptions({
        semverTag: false,
        from: '2',
        to: '1',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        semverTag: false,
        from: 'commit--release-v2',
        to: 'commit--release-v1',
      }),
    );
  });

  it('should forward tags "form" and "to" if "semverTag" is true', async () => {
    await expect(
      normalizeHashOptions({
        semverTag: true,
        from: '2',
        to: '1',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        semverTag: true,
        from: '2',
        to: '1',
      }),
    );
  });

  it('should forward hashes "form" and "to" if "semverTag" is true', async () => {
    await expect(
      normalizeHashOptions({
        semverTag: true,
        from: 'commit-3',
        to: 'commit-1',
      } as HistoryCliOptions & HistoryOptions),
    ).resolves.toEqual(
      expect.objectContaining({
        semverTag: true,
        from: 'commit-3',
        to: 'commit-1',
      }),
    );
  });
});
