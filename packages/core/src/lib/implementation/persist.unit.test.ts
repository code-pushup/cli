import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Report } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
  REPORT_MOCK,
} from '@code-pushup/test-utils';
import { scoreReport, sortReport, ui } from '@code-pushup/utils';
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
    expect(mdReport).toMatch(
      /\|\s*🏷 Category\s*\|\s*⭐ Score\s*\|\s*🛡 Audits\s*\|/,
    );

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
    expect(ui()).toHaveNthLogged(
      1,
      'success',
      expect.stringContaining('Generated reports successfully: '),
    );
    expect(ui()).toHaveNthLogged(
      2,
      'success',
      expect.stringContaining('9.77 kB'),
    );
    expect(ui()).toHaveNthLogged(
      2,
      'success',
      expect.stringContaining('out.json'),
    );
  });

  it('should log fails correctly`', () => {
    logPersistedResults([{ status: 'rejected', reason: 'fail' }]);
    expect(ui()).toHaveNthLogged(1, 'warn', 'Generated reports failed: ');
    expect(ui()).toHaveNthLogged(2, 'warn', expect.stringContaining('fail'));
  });

  it('should log report sizes and fails correctly`', () => {
    logPersistedResults([
      { status: 'fulfilled', value: ['out.json', 10_000] },
      { status: 'rejected', reason: 'fail' },
    ]);
    expect(ui()).toHaveNthLogged(
      1,
      'success',
      'Generated reports successfully: ',
    );
    expect(ui()).toHaveNthLogged(
      2,
      'success',
      expect.stringContaining('out.json'),
    );
    expect(ui()).toHaveNthLogged(
      2,
      'success',
      expect.stringContaining('9.77 kB'),
    );
    expect(ui()).toHaveNthLogged(
      3,
      'warn',
      expect.stringContaining('Generated reports failed: '),
    );
    expect(ui()).toHaveNthLogged(3, 'warn', expect.stringContaining('fail'));
  });
});
