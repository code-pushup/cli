import {describe} from 'vitest';
import {Report} from '@code-pushup/models';
import {ISO_STRING_REGEXP, MINIMAL_CONFIG_MOCK,} from '@code-pushup/testing-utils';
import {guardAgainstDirtyRepo} from '@code-pushup/utils';
import {history, HistoryOptions} from './history';
import {collect} from './implementation/collect';
import {persistReport} from './implementation/persist';
import {writeFile} from "fs/promises";

vi.mock('./implementation/collect', () => ({
  collect: vi.fn().mockResolvedValue({
    packageName: 'code-pushup',
    version: '0.0.1',
    date: new Date().toISOString(),
    duration: 0,
    categories: [],
    plugins: [],
  } as Report),
}));

vi.mock('./implementation/persist', () => ({
  persistReport: vi.fn(),
  logPersistedResults: vi.fn(),
}));

describe('history', () => {
  it('should call collect and persistReport with correct parameters in non-verbose mode', async () => {
    const nonVerboseConfig: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: false,
      progress: false,
      targetBranch: 'main',
    };
    await history(nonVerboseConfig);

    expect(collect).toHaveBeenCalledWith(nonVerboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 0,
        categories: [],
        plugins: [],
      },
      nonVerboseConfig,
    );
  });

  it('should call collect and persistReport with correct parameters in verbose mode', async () => {
    const verboseConfig: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      verbose: true,
      progress: false,
    };
    await history(verboseConfig);

    expect(collect).toHaveBeenCalledWith(verboseConfig);

    expect(persistReport).toHaveBeenCalledWith(
      {
        packageName: 'code-pushup',
        version: '0.0.1',
        date: expect.stringMatching(ISO_STRING_REGEXP),
        duration: 0,
        categories: [],
        plugins: [],
      } as Report,
      verboseConfig,
    );
  });
});

describe('guardAgainstDirtyRepo', () => {
  it('should pass for clean repo', async () => {
    await guardAgainstDirtyRepo();
  });

  it('should throw for dirty repo', async () => {
    await writeFile('./txt.md','');
    await expect(guardAgainstDirtyRepo()).rejects.toThrow(
      'Repository should be clean before we you can proceed.',
    );
  });
});
