import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockConsole, unmockConsole } from '../../test';
import { FileResult } from './file-system';
import { logMultipleResults, logPluginExecution } from './log-results';
import { formatBytes } from './report';

const succeededCallback = (result: PromiseFulfilledResult<FileResult>) => {
  const [fileName, size] = result.value;
  console.log(
    `- ${chalk.bold(fileName)}` +
      (size ? ` (${chalk.gray(formatBytes(size))})` : ''),
  );
};

const failedCallback = (result: PromiseRejectedResult) => {
  console.log(`- ${chalk.bold(result.reason)}`);
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

  it('should call logPluginExecution with successfull plugin result', async () => {
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

  it('should call logPluginExecution with failed plugin result', async () => {
    logMultipleResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports',
      succeededCallbackMock,
      failedCallbackMock,
    );

    expect(failedCallbackMock).toHaveBeenCalled();
    expect(succeededCallbackMock).not.toHaveBeenCalled();
  });

  it('should call logPluginExecution twice', async () => {
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

describe('logPluginExecution', () => {
  let logs: string[];
  const setupConsole = async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  };
  const teardownConsole = async () => {
    logs = [];
    unmockConsole();
  };

  beforeEach(async () => {
    logs = [];
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should log success plugins', async () => {
    logPluginExecution(
      [
        {
          status: 'fulfilled',
          value: ['out.json'],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Uploaded reports successfully: ',
      succeededCallback,
    );

    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Uploaded reports successfully: ');
    expect(logs[1]).toContain('- [1mout.json[22m');
  });

  it('should log failed plugins', async () => {
    logPluginExecution(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports failed: ',
      failedCallback,
    );

    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Generated reports failed: ');
    expect(logs[1]).toContain('- [1mfail[22m');
  });
});
