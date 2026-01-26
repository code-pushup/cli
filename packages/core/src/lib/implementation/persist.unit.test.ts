import ansis from 'ansis';
import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Report } from '@code-pushup/models';
import { MINIMAL_REPORT_MOCK, REPORT_MOCK } from '@code-pushup/test-fixtures';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger, scoreReport, sortReport } from '@code-pushup/utils';
import { logPersistedReport, persistReport } from './persist.js';

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
    expect(mdReport).toContain('Code PushUp report');

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
    expect(mdReport).toContain('Code PushUp report');
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

describe('logPersistedReport', () => {
  it('should log report sizes correctly`', () => {
    let output = '';
    vi.spyOn(logger, 'info').mockImplementation(msg => {
      output += `${msg}\n`;
    });

    logPersistedReport([
      {
        file: path.join('.code-pushup', 'report.json'),
        size: 2 * Math.pow(2, 20),
      },
      {
        file: path.join('.code-pushup', 'report.md'),
        size: 3 * Math.pow(2, 20),
      },
    ]);

    expect(ansis.strip(output)).toBe(
      `
Persisted report to file system:
• ${path.join('.code-pushup', 'report.json')} (2 MB)
• ${path.join('.code-pushup', 'report.md')} (3 MB)
`.trimStart(),
    );
  });
});
