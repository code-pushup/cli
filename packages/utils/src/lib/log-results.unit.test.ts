import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileResult } from './file-system';
import { logMultipleResults, logPromiseResults } from './log-results';
import { formatBytes } from './report';

const succeededCallback = (result: PromiseFulfilledResult<FileResult>) => {
  const [fileName, size] = result.value;
  console.info(
    `- ${chalk.bold(fileName)}` +
      (size ? ` (${chalk.gray(formatBytes(size))})` : ''),
  );
};

const failedCallback = (result: PromiseRejectedResult) => {
  console.warn(`- ${chalk.bold(result.reason)}`);
};

describe('logMultipleResults', () => {
  const succeededCallbackMock = vi.fn().mockImplementation(succeededCallback);
  const failedCallbackMock = vi.fn().mockImplementation(failedCallback);

  beforeEach(() => {
    succeededCallbackMock.mockClear();
    failedCallbackMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call logPromiseResults with successfull plugin result', async () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10000],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(succeededCallbackMock).toHaveBeenCalled();
    expect(failedCallbackMock).not.toHaveBeenCalled();
  });

  it('should call logPromiseResults with failed plugin result', async () => {
    logMultipleResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(failedCallbackMock).toHaveBeenCalled();
    expect(succeededCallbackMock).not.toHaveBeenCalled();
  });

  it('should call logPromiseResults twice', async () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10000],
        } as PromiseFulfilledResult<FileResult>,
        { status: 'rejected', reason: 'fail' } as PromiseRejectedResult,
      ],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(succeededCallbackMock).toHaveBeenCalled();
    expect(failedCallbackMock).toHaveBeenCalled();
  });
});

describe('logPromiseResults', () => {
  it('should log on success', async () => {
    logPromiseResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json'],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Uploaded reports successfully: ',
      succeededCallback,
    );

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Uploaded reports successfully: '),
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('- [1mout.json[22m'),
    );
  });

  it('should log on fail', async () => {
    logPromiseResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports failed: ',
      failedCallback,
    );

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Generated reports failed: '),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('- [1mfail[22m'),
    );
  });
});
