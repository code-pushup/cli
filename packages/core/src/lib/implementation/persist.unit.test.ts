import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Report } from '@code-pushup/models';
import { MINIMAL_REPORT_MOCK, REPORT_MOCK } from '@code-pushup/test-fixtures';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger, scoreReport, sortReport } from '@code-pushup/utils';
import { logPersistedResults, persistReport } from './persist.js';

describe('persistReport', () => {
  beforeEach(() => {
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create a report in json format', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));
    await persistReport(MINIMAL_REPORT_MOCK, sortedScoredReport, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['json'],
    });

    const jsonReport: Report = JSON.parse(
      await readFile(path.join(MEMFS_VOLUME, 'report.json'), 'utf8'),
    );
    expect(jsonReport).toEqual(
      expect.objectContaining({
        packageName: '@code-pushup/core',
        duration: 666,
      }),
    );

    await expect(() =>
      readFile(path.join(MEMFS_VOLUME, 'report.md')),
    ).rejects.toThrow('no such file or directory');
  });

  it('should create a report in md format', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));
    await persistReport(MINIMAL_REPORT_MOCK, sortedScoredReport, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['md'],
    });

    const mdReport = await readFile(
      path.join(MEMFS_VOLUME, 'report.md'),
      'utf8',
    );
    expect(mdReport).toContain('Code PushUp Report');

    await expect(() =>
      readFile(path.join(MEMFS_VOLUME, 'report.json'), 'utf8'),
    ).rejects.toThrow('no such file or directory');
  });

  it('should create a report with categories section in all formats', async () => {
    const sortedScoredReport = sortReport(scoreReport(REPORT_MOCK));
    await persistReport(REPORT_MOCK, sortedScoredReport, {
      outputDir: MEMFS_VOLUME,
      format: ['md', 'json'],
      filename: 'report',
    });

    const mdReport = await readFile(
      path.join(MEMFS_VOLUME, 'report.md'),
      'utf8',
    );
    expect(mdReport).toContain('Code PushUp Report');
    expect(mdReport).toContainMarkdownTableRow([
      '🏷 Category',
      '⭐ Score',
      '🛡 Audits',
    ]);

    const jsonReport: Report = JSON.parse(
      await readFile(path.join(MEMFS_VOLUME, 'report.json'), 'utf8'),
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
  it('should log report sizes correctly`', () => {
    logPersistedResults([{ status: 'fulfilled', value: ['out.json', 10_000] }]);
    expect(logger.debug).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Generated reports successfully: '),
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('9.77 kB'),
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('out.json'),
    );
  });

  it('should log fails correctly`', () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      'Generated reports failed: ',
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('fail'),
    );
  });

  it('should log report sizes and fails correctly`', () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10_000] },
      { status: 'rejected', reason: 'fail' },
    ]);
    expect(logger.debug).toHaveBeenNthCalledWith(
      1,
      'Generated reports successfully: ',
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('out.json'),
    );
    expect(logger.debug).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('9.77 kB'),
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('Generated reports failed: '),
    );
    expect(logger.warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('fail'),
    );
  });
});
