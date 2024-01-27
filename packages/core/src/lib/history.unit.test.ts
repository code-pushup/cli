import {describe, expect} from 'vitest';
import {Report} from '@code-pushup/models';
import {
  MINIMAL_CONFIG_MOCK,
  makeStatusClean,
  makeStatusDirty,
} from '@code-pushup/testing-utils';
import {guardAgainstDirtyRepo} from '@code-pushup/utils';
import {HistoryOptions, history} from './history';

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
    await expect( history(nonVerboseConfig, [])).resolves.toBeDefined();
  });
});

describe('guardAgainstDirtyRepo', () => {
  it('should pass for clean repo', async () => {
    await expect(guardAgainstDirtyRepo()).resolves.toBeDefined();
  });

  it('should throw for dirty repo', async () => {
    await makeStatusDirty();
    await expect(guardAgainstDirtyRepo()).rejects.toThrow(
      'Repository should be clean before we you can proceed.',
    );
    await makeStatusClean();
  });
});
