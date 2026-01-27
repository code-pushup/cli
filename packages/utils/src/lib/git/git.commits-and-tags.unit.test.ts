import { filterLogs, getSemverTags } from './git.commits-and-tags.js';

vi.mock('simple-git', async () => {
  const actual = await vi.importActual('simple-git');
  const orderedTagsHistory = ['5.0.0', '4.0.0', '3.0.0', '2.0.0', '1.0.0'];
  return {
    ...actual,
    simpleGit: () => ({
      branch: () => Promise.resolve('dummy'),
      // @TODO fix return value
      tag: () => Promise.resolve(orderedTagsHistory.join('\n')),
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
      filterLogs(['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0'], {
        maxCount: 2,
      }),
    ).toStrictEqual(['1.0.0', '2.0.0']);
  });

  it('should forward list items starting from index based on "from" filter', () => {
    expect(
      filterLogs(['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0'], {
        from: '3.0.0',
      }),
    ).toStrictEqual(['3.0.0', '4.0.0', '5.0.0']);
  });

  it('should throw for "to" without "from" filter', () => {
    expect(() => filterLogs([], { to: 'e' })).toThrow(
      'filter needs the "from" option defined to accept the "to" option.',
    );
  });

  it('should forward list items starting from index based on "from" & "to" filter', () => {
    expect(
      filterLogs(['1.0.0', '2.0.0', '3.0.0', '4.0.0', '5.0.0'], {
        from: '2.0.0',
        to: '4.0.0',
      }),
    ).toStrictEqual(['2.0.0', '3.0.0', '4.0.0']);
  });
});

describe('getSemverTags', () => {
  it('should list all tags on the branch', async () => {
    await expect(getSemverTags({})).resolves.toStrictEqual([
      {
        hash: expect.any(String),
        message: '5.0.0',
      },
      {
        hash: expect.any(String),
        message: '4.0.0',
      },
      {
        hash: expect.any(String),
        message: '3.0.0',
      },
      {
        hash: expect.any(String),
        message: '2.0.0',
      },
      {
        hash: expect.any(String),
        message: '1.0.0',
      },
    ]);
  });

  it('should get last 2 tags from branch if maxCount is set to 2', async () => {
    await expect(getSemverTags({ maxCount: 2 })).resolves.toStrictEqual([
      {
        hash: expect.any(String),
        message: '5.0.0',
      },
      {
        hash: expect.any(String),
        message: '4.0.0',
      },
    ]);
  });

  it('should get tags from branch based on "from"', async () => {
    await expect(getSemverTags({ from: '4.0.0' })).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4.0.0',
      },
      {
        hash: expect.any(String),
        message: '3.0.0',
      },
      {
        hash: expect.any(String),
        message: '2.0.0',
      },
      {
        hash: expect.any(String),
        message: '1.0.0',
      },
    ]);
  });

  it('should get tags from branch based on "from" and "to"', async () => {
    await expect(
      getSemverTags({ from: '4.0.0', to: '2.0.0' }),
    ).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4.0.0',
      },
      {
        hash: expect.any(String),
        message: '3.0.0',
      },
      {
        hash: expect.any(String),
        message: '2.0.0',
      },
    ]);
  });

  it('should get tags from branch based on "from" and "to" and "maxCount"', async () => {
    await expect(
      getSemverTags({ from: '4.0.0', to: '2.0.0', maxCount: 2 }),
    ).resolves.toEqual([
      {
        hash: expect.any(String),
        message: '4.0.0',
      },
      {
        hash: expect.any(String),
        message: '3.0.0',
      },
    ]);
  });

  it('should throw if "from" is undefined but "to" is defined', async () => {
    await expect(getSemverTags({ from: undefined, to: 'a' })).rejects.toThrow(
      'filter needs the "from" option defined to accept the "to" option',
    );
  });
});
