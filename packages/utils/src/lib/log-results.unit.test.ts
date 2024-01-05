import { describe, expect, it, vi } from 'vitest';
import { FileResult } from './file-system';
import { logMultipleResults, logPromiseResults } from './log-results';

describe('logMultipleResults', () => {
  const succeededCallbackMock = vi.fn();
  const failedCallbackMock = vi.fn();

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

    expect(succeededCallbackMock).toHaveBeenCalledOnce();
    expect(failedCallbackMock).toHaveBeenCalledOnce();
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
      'Uploaded reports successfully:',
      result => {
        console.info(result.value);
      },
    );

    expect(console.info).toHaveBeenNthCalledWith(
      1,
      'Uploaded reports successfully:',
    );
    expect(console.info).toHaveBeenNthCalledWith(2, ['out.json']);
  });

  it('should log on fail', async () => {
    logPromiseResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports failed:',
      result => {
        console.warn(result.reason);
      },
    );

    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Generated reports failed:',
    );
    expect(console.warn).toHaveBeenNthCalledWith(2, 'fail');
  });
});
