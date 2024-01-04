import { readFileSync } from 'fs';
import { vol } from 'memfs';
import { join } from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { Report } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/models/testing';
import { MINIMAL_REPORT_MOCK } from '@code-pushup/testing-utils';
import { logPersistedResults, persistReport } from './persist';

// @TODO: should throw PersistDirError
// @TODO: should throw PersistError
describe('persistReport', () => {
  beforeEach(() => {
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should print a summary to stdout when no format is specified`', async () => {
    await persistReport(MINIMAL_REPORT_MOCK, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: [],
    });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Made with ❤ by code-pushup.dev'),
    );
  });

  it('should print a summary to stdout when all formats are specified`', async () => {
    await persistReport(MINIMAL_REPORT_MOCK, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['md', 'json'],
    });
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Made with ❤ by code-pushup.dev'),
    );
  });

  it('should create a report in json format', async () => {
    await persistReport(MINIMAL_REPORT_MOCK, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['json'],
    });

    const jsonReport: Report = JSON.parse(
      readFileSync(join(MEMFS_VOLUME, 'report.json')).toString(),
    );
    expect(jsonReport).toEqual(
      expect.objectContaining({
        packageName: '@code-pushup/core',
        duration: 666,
      }),
    );

    expect(() => readFileSync(join(MEMFS_VOLUME, 'report.md'))).toThrow(
      'no such file or directory',
    );
  });

  it('should create a report in md format', async () => {
    await persistReport(MINIMAL_REPORT_MOCK, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['md'],
    });

    const mdReport = readFileSync(join(MEMFS_VOLUME, 'report.md')).toString();
    expect(mdReport).toContain('Code PushUp Report');

    expect(() => readFileSync(join(MEMFS_VOLUME, 'report.json'))).toThrow(
      'no such file or directory',
    );
  });

  it('should create a report in all formats', async () => {
    await persistReport(MINIMAL_REPORT_MOCK, {
      outputDir: MEMFS_VOLUME,
      format: ['md', 'json'],
      filename: 'report',
    });

    const mdReport = readFileSync(join(MEMFS_VOLUME, 'report.md')).toString();
    expect(mdReport).toContain('Code PushUp Report');
    expect(mdReport).toContain('|🏷 Category|⭐ Score|🛡 Audits|');

    const jsonReport: Report = JSON.parse(
      readFileSync(join(MEMFS_VOLUME, 'report.json')).toString(),
    );
    expect(jsonReport).toEqual(
      expect.objectContaining({
        packageName: '@code-pushup/core',
        duration: 666,
      }),
    );
  });
});

describe('logPersistedResults', () => {
  it('should log report sizes correctly`', async () => {
    logPersistedResults([{ status: 'fulfilled', value: ['out.json', 10000] }]);
    expect(console.info).toHaveBeenNthCalledWith(
      1,
      'Generated reports successfully: ',
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('9.77 kB'),
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('out.json'),
    );
  });

  it('should log fails correctly`', async () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);

    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Generated reports failed: ',
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('fail'),
    );
  });

  it('should log report sizes and fails correctly`', async () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10000] },
      { status: 'rejected', reason: 'fail' },
    ]);

    expect(console.info).toHaveBeenNthCalledWith(
      1,
      'Generated reports successfully: ',
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('out.json'),
    );
    expect(console.info).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('9.77 kB'),
    );

    expect(console.warn).toHaveBeenNthCalledWith(
      1,
      'Generated reports failed: ',
    );
    expect(console.warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('fail'),
    );
  });
});
