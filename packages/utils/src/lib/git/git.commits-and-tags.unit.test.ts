import { describe, expect, vi } from 'vitest';
import { filterLogs, getSemverTags } from './git.commits-and-tags';

vi.mock('simple-git', async () => {
  const actual = await vi.importActual('simple-git');
  return {
    ...actual,
    simpleGit: () => ({
      branch: () => Promise.resolve('dummy'),
      // @TODO fix return value
      tag: () => Promise.resolve(`5\n 4\n 3\n 2\n 1`),
      show: ([_, __, tag]: string) =>
        Promise.resolve(`release v${tag}\n ${tag}`),
      raw: () => Promise.resolve('main'),
      checkout: () => Promise.resolve(),
      log: ({ maxCount }: { maxCount: number } = { maxCount: 1 }) =>
        Promise.resolve({
          all: [
            { hash: 'commit-6' },
            { hash: 'commit-5' },
            { hash: 'commit-4' },
            { hash: 'commit-3' },
            { hash: 'commit-2' },
            { hash: 'commit-1' },
          ].slice(-maxCount),
        }),
    }),
  };
});

describe('filterLogs', () => {
  it('should forward list if no filter are given', () => {
    const tags = ['cli@0.1.0', 'utils@0.1.0', 'v0.1.0'];
    expect(
      filterLogs(tags, { from: undefined, to: undefined, maxCount: undefined }),
    ).toStrictEqual(tags);
  });

  it('should forward list the first N items based on "maxCount" filter', () => {
    expect(
      filterLogs(['1', '2', '3', '4', '5'], { maxCount: 2 }),
    ).toStrictEqual(['1', '2']);
  });

  it('should forward list items starting from index based on "from" filter', () => {
    expect(filterLogs(['1', '2', '3', '4', '5'], { from: '3' })).toStrictEqual([
      '3',
      '4',
      '5',
    ]);
  });

  it('should throw for "to" without "from" filter', () => {
    expect(() => filterLogs([], { to: 'e' })).toThrow(
      'filter needs the "from" option defined to accept the "to" option.',
    );
  });

  it('should forward list items starting from index based on "from" & "to" filter', () => {
    expect(
      filterLogs(['1', '2', '3', '4', '5'], { from: '2', to: '4' }),
    ).toStrictEqual(['2', '3', '4']);
  });
});

describe('getSemverTags', () => {
  it('should list all tags on the branch', async () => {
    await expect(getSemverTags({})).resolves.toStrictEqual([
      {
        hash: expect.any(String),
        message: '5',
      },
      {
        hash: expect.any(String),
        message: '4',
      },
      {
        hash: expect.any(String),
        message: '3',
      },
      {
        hash: expect.any(String),
        message: '2',
      },
      {
        hash: expect.any(String),
        message: '1',
      },
    ]);
  });

  it('should get last 2 tags from branch if maxCount is set to 2', async () => {
    await expect(getSemverTags({ maxCount: 2 })).resolves.toStrictEqual([
      {
        hash: expect.any(String),
        message: '5',
      },
      {
        hash: expect.any(String),
        message: '4',
      },
    ]);
  });

  it('should get tags from branch based on "from"', async () => {
    await expect(getSemverTags({ from: '4' })).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4',
      },
      {
        hash: expect.any(String),
        message: '3',
      },
      {
        hash: expect.any(String),
        message: '2',
      },
      {
        hash: expect.any(String),
        message: '1',
      },
    ]);
  });

  it('should get tags from branch based on "from" and "to"', async () => {
    await expect(getSemverTags({ from: '4', to: '2' })).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4',
      },
      {
        hash: expect.any(String),
        message: '3',
      },
      {
        hash: expect.any(String),
        message: '2',
      },
    ]);
  });

  it('should get tags from branch based on "from" and "to" and "maxCount"', async () => {
    await expect(
      getSemverTags({ from: '4', to: '2', maxCount: 2 }),
    ).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4',
      },
      {
        hash: expect.any(String),
        message: '3',
      },
    ]);
  });

  it('should throw if "from" is undefined but "to" is defined', async () => {
    await expect(getSemverTags({ from: undefined, to: 'a' })).rejects.toThrow(
      'filter needs the "from" option defined to accept the "to" option',
    );
  });
});
