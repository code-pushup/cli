import { beforeEach, describe, expect, vi } from 'vitest';
import { collectAndPersistReports, upload } from '@code-pushup/core';
import {
  MINIMAL_CONFIG_MOCK,
  makeStatusClean,
  makeStatusDirty,
} from '@code-pushup/testing-utils';
import { guardAgainstDirtyRepo } from '@code-pushup/utils';
import { HistoryOptions, history } from './history';

describe('history', () => {
  beforeEach(async () => {
    await makeStatusClean();
  });

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

  it('should guard against dirty git history', async () => {
    const historyOptions: HistoryOptions = {
      ...MINIMAL_CONFIG_MOCK,
      uploadReports: false,
      targetBranch: 'main',
      verbose: false,
      progress: false,
    };
    await makeStatusDirty();
    await expect(history(historyOptions, ['abc'])).rejects.toThrow(
      'Repository should be clean before we you can proceed',
    );
  });
});
