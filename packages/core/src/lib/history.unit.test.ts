import { describe, expect, vi } from 'vitest';
import { MINIMAL_CONFIG_MOCK } from '@code-pushup/test-utils';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { HistoryOptions, history, prepareHashes } from './history';
import { upload } from './upload';

vi.mock('@code-pushup/utils', async () => {
  const utils: object = await vi.importActual('@code-pushup/utils');
  return {
    ...utils,
    safeCheckout: vi.fn(),
    getCurrentBranchOrTag: vi.fn().mockReturnValue('main'),
  };
});
});

vi.mock('./collect-and-persist', () => ({
  collectAndPersistReports: vi.fn(),
}));

vi.mock('./upload', () => ({
  upload: vi.fn(),
}));

describe('history', () => {
  it('should check out all passed commits and reset to initial branch or tag', async () => {
    const historyOptions = MINIMAL_CONFIG_MOCK as HistoryOptions;

    await history(historyOptions, ['abc', 'def']);

    expect(getCurrentBranchOrTag).toHaveBeenCalledTimes(1);

    expect(safeCheckout).toHaveBeenCalledTimes(3);
    // walk commit history
    expect(safeCheckout).toHaveBeenNthCalledWith(1, 'abc', {});
    expect(safeCheckout).toHaveBeenNthCalledWith(2, 'def', {});
    // reset
    expect(safeCheckout).toHaveBeenNthCalledWith(3, 'main', {});
  });

  it('should return correct number of results', async () => {
    const historyOptions: HistoryOptions = {
      ...(MINIMAL_CONFIG_MOCK as HistoryOptions),
    };

    const results = await history(historyOptions, ['abc', 'def']);

    expect(results).toStrictEqual(['abc-report', 'def-report']);
  });

  it('should call collect with correct filename and format', async () => {
    const historyOptions: HistoryOptions = {
      ...(MINIMAL_CONFIG_MOCK as HistoryOptions),
    };

    await history(historyOptions, ['abc']);
    expect(collectAndPersistReports).toHaveBeenCalledTimes(1);
    expect(collectAndPersistReports).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        persist: expect.objectContaining({
          filename: 'abc-report',
          format: ['json'],
        }),
      }),
    );
  });

  it('should call upload by default', async () => {
    const historyOptions: HistoryOptions = {
      ...(MINIMAL_CONFIG_MOCK as HistoryOptions),
      upload: {
        server: 'https://server.com/api',
        project: 'cli',
        apiKey: '1234',
        organization: 'code-pushup',
        timeout: 4000,
      },
    };
    await history(historyOptions, ['abc']);

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        persist: expect.objectContaining({ filename: 'abc-report' }),
      }),
    );
  });

  it('should not call upload if skipUploads is set to false', async () => {
    const historyOptions: HistoryOptions = {
      ...(MINIMAL_CONFIG_MOCK as HistoryOptions),
      upload: {
        server: 'https://server.com/api',
        project: 'cli',
        apiKey: '1234',
        organization: 'code-pushup',
        timeout: 4000,
      },
      skipUploads: true,
    };
    await history(historyOptions, ['abc']);

    expect(upload).not.toHaveBeenCalled();
  });

  it('should not call upload if upload config is not given', async () => {
    const historyOptions: HistoryOptions = {
      ...(MINIMAL_CONFIG_MOCK as HistoryOptions),
    };
    await history(historyOptions, ['abc']);

    expect(upload).not.toHaveBeenCalled();
  });
});

describe('prepareHashes', () => {
  it('should get all commits from log if no option is passed', () => {
    expect(
      prepareHashes({ all: [{ hash: '1' }, { hash: '5' }] }),
    ).toStrictEqual(['5', '1']);
  });
});
