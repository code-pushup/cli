import { describe, expect, it, vi } from 'vitest';
import { FileResult } from './file-system';
import { logMultipleResults, logPromiseResults } from './log-results';

describe('logMultipleResults', () => {
  const succeededCallbackMock = vi.fn();
  const failedCallbackMock = vi.fn();

  it('should call logPromiseResults with successfully plugin result', () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10_000],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(succeededCallbackMock).toHaveBeenCalled();
    expect(failedCallbackMock).not.toHaveBeenCalled();
  });

  it('should call logPromiseResults with failed plugin result', () => {
    logMultipleResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(failedCallbackMock).toHaveBeenCalled();
    expect(succeededCallbackMock).not.toHaveBeenCalled();
  });

  it('should call logPromiseResults twice', () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10_000],
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
  it('should log on success', () => {
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

  it('should log on fail', () => {
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
