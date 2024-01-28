import {beforeEach, describe, expect, vi} from 'vitest';
import {makeStatusClean, makeStatusDirty, MINIMAL_CONFIG_MOCK,} from '@code-pushup/testing-utils';
import {guardAgainstDirtyRepo} from '@code-pushup/utils';
import {history, HistoryOptions} from './history';
import {collectAndPersistReports, upload} from "@code-pushup/core";


vi.mock('@code-pushup/utils', async () => {
  const utils: object = await vi.importActual('@code-pushup/utils');
  return {
    ...utils,
    safeCheckout: vi.fn().mockResolvedValue(void 0)
  };
});

vi.mock('./collect-and-persist', () => ({
  collectAndPersistReports: vi.fn(),
}));

vi.mock('./upload', () => ({
  upload: vi.fn(),
}));

describe('history', () => {

  beforeEach(async () => {
    await makeStatusClean();
  })

  it('should return an array of reports including reports for each commit given', async () => {
    const historyOptions: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      targetBranch: 'main',
      verbose: false,
      progress: false,
    };
    const reports = await history(historyOptions, ['a', 'b']);

    expect(reports).toHaveLength(2);
  });

  it('should call collect with persist options updated by commit hash', async () => {
    const historyOptions: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      uploadReports: true,
      targetBranch: 'main',
      verbose: false,
      progress: false,
    };
    await history(historyOptions, ['abc']);

    expect(collectAndPersistReports).toHaveBeenCalledWith(expect.objectContaining({
      targetBranch: "main",
      persist: expect.objectContaining({
        filename: "abc-report",
        format: ["json"],
      }),
    }));

    expect(upload).toHaveBeenCalledWith(expect.objectContaining({
      persist: expect.objectContaining({
        filename: "abc-report"
      }),
    }));
  });

  it('should guard against dirty git history', async () => {
    const historyOptions: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      uploadReports: false,
      targetBranch: 'main',
      verbose: false,
      progress: false,
    };
    await makeStatusDirty();
    await expect(history(historyOptions, ['abc'])).rejects.toThrow('Repository should be clean before we you can proceed');
  });

  it('should not call upload if uploadReports is set to false', async () => {
    const historyOptions: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      uploadReports: false,
      targetBranch: 'main',
      verbose: false,
      progress: false,
    };
    await history(historyOptions, ['abc']);

    expect(collectAndPersistReports).toHaveBeenCalledWith(expect.objectContaining({
      targetBranch: "main",
      persist: expect.objectContaining({
        filename: "abc-report",
        format: ["json"],
      }),
    }));

    expect(upload).not.toHaveBeenCalled();
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
