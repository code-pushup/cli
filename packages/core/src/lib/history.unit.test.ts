import { describe, expect, vi } from 'vitest';
import { MINIMAL_PLUGIN_CONFIG_MOCK } from '@code-pushup/test-utils';
import { getCurrentBranchOrTag, safeCheckout } from '@code-pushup/utils';
import { collectAndPersistReports } from './collect-and-persist';
import { type HistoryOptions, history } from './history';
import { upload } from './upload';

vi.mock('@code-pushup/utils', async () => {
  const utils: object = await vi.importActual('@code-pushup/utils');
  return {
    ...utils,
    safeCheckout: vi.fn(),
    getCurrentBranchOrTag: vi.fn().mockReturnValue('main'),
  };
});

vi.mock('./collect-and-persist', () => ({
  collectAndPersistReports: vi.fn(),
}));

vi.mock('./upload', () => ({
  upload: vi.fn(),
}));

describe('history', () => {
  const historyBaseOptions: HistoryOptions = {
    persist: {
      outputDir: '.code-pushup',
      filename: 'history-report',
      format: ['json'],
    },
    plugins: [MINIMAL_PLUGIN_CONFIG_MOCK],
  };
  it('should check out all passed commits and reset to initial branch or tag', async () => {
    await history(historyBaseOptions, ['abc', 'def']);

    expect(getCurrentBranchOrTag).toHaveBeenCalledTimes(1);

    expect(safeCheckout).toHaveBeenCalledTimes(3);
    // walk commit history
    expect(safeCheckout).toHaveBeenNthCalledWith(1, 'abc', undefined);
    expect(safeCheckout).toHaveBeenNthCalledWith(2, 'def', undefined);
    // reset
    expect(safeCheckout).toHaveBeenNthCalledWith(3, 'main', undefined);
  });

  it('should return correct number of results', async () => {
    const results = await history(historyBaseOptions, ['abc', 'def']);

    expect(results).toStrictEqual(['abc-report', 'def-report']);
  });

  it('should call collect with correct filename and format', async () => {
    await history(historyBaseOptions, ['abc']);
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
    const historyOptions = {
      ...historyBaseOptions,
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
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        persist: expect.objectContaining({ filename: 'abc-report' }),
      }),
    );
  });

  it('should not call upload if skipUploads is set to false', async () => {
    const historyOptions = {
      ...historyBaseOptions,
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
    await history(historyBaseOptions, ['abc']);

    expect(upload).not.toHaveBeenCalled();
  });
});
