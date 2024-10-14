import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Report } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
  REPORT_MOCK,
  getLogMessages,
} from '@code-pushup/test-utils';
import { scoreReport, sortReport, ui } from '@code-pushup/utils';
import { logPersistedResults, persistReport } from './persist';

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
      await readFile(join(MEMFS_VOLUME, 'report.json'), 'utf8'),
    );
    expect(jsonReport).toEqual(
      expect.objectContaining({
        packageName: '@code-pushup/core',
        duration: 666,
      }),
    );

    await expect(() =>
      readFile(join(MEMFS_VOLUME, 'report.md')),
    ).rejects.toThrow('no such file or directory');
  });

  it('should create a report in md format', async () => {
    const sortedScoredReport = sortReport(scoreReport(MINIMAL_REPORT_MOCK));
    await persistReport(MINIMAL_REPORT_MOCK, sortedScoredReport, {
      outputDir: MEMFS_VOLUME,
      filename: 'report',
      format: ['md'],
    });

    const mdReport = await readFile(join(MEMFS_VOLUME, 'report.md'), 'utf8');
    expect(mdReport).toContain('Code PushUp Report');

    await expect(() =>
      readFile(join(MEMFS_VOLUME, 'report.json'), 'utf8'),
    ).rejects.toThrow('no such file or directory');
  });

  it('should create a report with categories section in all formats', async () => {
    const sortedScoredReport = sortReport(scoreReport(REPORT_MOCK));
    await persistReport(REPORT_MOCK, sortedScoredReport, {
      outputDir: MEMFS_VOLUME,
      format: ['md', 'json'],
      filename: 'report',
    });

    const mdReport = await readFile(join(MEMFS_VOLUME, 'report.md'), 'utf8');
    expect(mdReport).toContain('Code PushUp Report');
    expect(mdReport).toMatch(
      /\|\s*🏷 Category\s*\|\s*⭐ Score\s*\|\s*🛡 Audits\s*\|/,
    );

    const jsonReport: Report = JSON.parse(
      await readFile(join(MEMFS_VOLUME, 'report.json'), 'utf8'),
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
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toBe('[ green(success) ] Generated reports successfully: ');
    expect(logs[1]).toContain('9.77 kB');
    expect(logs[1]).toContain('out.json');
  });

  it('should log fails correctly`', () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toBe('[ yellow(warn) ] Generated reports failed: ');
    expect(logs[1]).toContain('fail');
  });

  it('should log report sizes and fails correctly`', () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10_000] },
      { status: 'rejected', reason: 'fail' },
    ]);
    const logs = getLogMessages(ui().logger);
    expect(logs[0]).toBe('[ green(success) ] Generated reports successfully: ');
    expect(logs[1]).toContain('out.json');
    expect(logs[1]).toContain('9.77 kB');

    expect(logs[2]).toContain('Generated reports failed: ');
    expect(logs[2]).toContain('fail');
  });
});
