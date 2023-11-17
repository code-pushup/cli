import chalk from 'chalk';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockConsole, unmockConsole } from '../../test';
import { FileResult } from './file-system';
import { logMultipleResults } from './log-results';
import { formatBytes } from './report';

describe('logMultipleResults', () => {
  let logs: string[];
  const setupConsole = async () => {
    logs = [];
    mockConsole(msg => logs.push(msg));
  };
  const teardownConsole = async () => {
    logs = [];
    unmockConsole();
  };
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

  beforeEach(async () => {
    logs = [];
    setupConsole();
  });

  afterEach(() => {
    teardownConsole();
  });

  it('should log reports correctly`', async () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json'],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Uploaded reports',
      succeededCallback,
      failedCallback,
    );
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Uploaded reports successfully: ');
    expect(logs[1]).toContain('- [1mout.json[22m');
  });

  it('should log report sizes correctly`', async () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10000],
        } as PromiseFulfilledResult<FileResult>,
      ],
      'Generated reports',
      succeededCallback,
      failedCallback,
    );
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Generated reports successfully: ');
    expect(logs[1]).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');
  });

  it('should log fails correctly`', async () => {
    logMultipleResults(
      [{ status: 'rejected', reason: 'fail' } as PromiseRejectedResult],
      'Generated reports',
      succeededCallback,
      failedCallback,
    );
    expect(logs).toHaveLength(2);

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });

  it('should log report sizes and fails correctly`', async () => {
    logMultipleResults(
      [
        {
          status: 'fulfilled',
          value: ['out.json', 10000],
        } as PromiseFulfilledResult<FileResult>,
        { status: 'rejected', reason: 'fail' } as PromiseRejectedResult,
      ],
      'Generated reports',
      succeededCallback,
      failedCallback,
    );
    expect(logs).toHaveLength(4);
    expect(logs).toContain('Generated reports successfully: ');
    expect(logs).toContain('- [1mout.json[22m ([90m9.77 kB[39m)');

    expect(logs).toContain('Generated reports failed: ');
    expect(logs).toContain('- [1mfail[22m');
  });
});
