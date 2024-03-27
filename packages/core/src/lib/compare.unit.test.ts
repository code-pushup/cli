import { vol } from 'memfs';
import { join } from 'node:path';
import { Commit, Report, reportsDiffSchema } from '@code-pushup/models';
import {
  COMMIT_ALT_MOCK,
  COMMIT_MOCK,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
  REPORT_MOCK,
  reportMock,
} from '@code-pushup/test-utils';
import { Diff, fileExists, readJsonFile } from '@code-pushup/utils';
import { compareReportFiles, compareReports } from './compare';

describe('compareReportFiles', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        'source-report.json': JSON.stringify(MINIMAL_REPORT_MOCK),
        'target-report.json': JSON.stringify(REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );
  });

  it('should create valid report-diff.json from report.json files', async () => {
    await compareReportFiles(
      {
        before: join(MEMFS_VOLUME, 'source-report.json'),
        after: join(MEMFS_VOLUME, 'target-report.json'),
      },
      { outputDir: MEMFS_VOLUME, filename: 'report', format: ['json'] },
    );

    const reportsDiffPromise = readJsonFile(
      join(MEMFS_VOLUME, 'report-diff.json'),
    );
    await expect(reportsDiffPromise).resolves.toBeTruthy();

    const reportsDiff = await reportsDiffPromise;
    expect(() => reportsDiffSchema.parse(reportsDiff)).not.toThrow();
  });

  it('should create all diff files specified by persist.format', async () => {
    await compareReportFiles(
      {
        before: join(MEMFS_VOLUME, 'source-report.json'),
        after: join(MEMFS_VOLUME, 'target-report.json'),
      },
      { outputDir: MEMFS_VOLUME, filename: 'report', format: ['json', 'md'] },
    );

    await expect(
      fileExists(join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.toBeTruthy();
    await expect(
      fileExists(join(MEMFS_VOLUME, 'report-diff.md')),
    ).resolves.toBeTruthy();
  });
});

describe('compareReports', () => {
  const mockCommits: Diff<Commit> = {
    before: COMMIT_MOCK,
    after: COMMIT_ALT_MOCK,
  };

  describe('unchanged reports', () => {
    const mockReport = reportMock();
    const mockReports: Diff<Report> = {
      before: { ...mockReport, commit: mockCommits.before },
      after: { ...mockReport, commit: mockCommits.after },
    };

    it('should create valid report diff', () => {
      const reportsDiff = compareReports(mockReports);
      expect(() => reportsDiffSchema.parse(reportsDiff)).not.toThrow();
    });

    it('should include commits from both reports', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.commits).toEqual(mockCommits);
    });

    it('should have no changes, additions or removals', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.categories.changed).toHaveLength(0);
      expect(reportsDiff.categories.added).toHaveLength(0);
      expect(reportsDiff.categories.removed).toHaveLength(0);
      expect(reportsDiff.groups.changed).toHaveLength(0);
      expect(reportsDiff.groups.added).toHaveLength(0);
      expect(reportsDiff.groups.removed).toHaveLength(0);
      expect(reportsDiff.audits.changed).toHaveLength(0);
      expect(reportsDiff.audits.added).toHaveLength(0);
      expect(reportsDiff.audits.removed).toHaveLength(0);
    });

    it('should contain all categories/groups/audits in unchanged arrays', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.categories.unchanged).toHaveLength(
        mockReport.categories.length,
      );
      expect(reportsDiff.groups.unchanged).toHaveLength(
        mockReport.plugins.reduce((acc, { groups }) => acc + groups!.length, 0),
      );
      expect(reportsDiff.audits.unchanged).toHaveLength(
        mockReport.plugins.reduce((acc, { audits }) => acc + audits.length, 0),
      );
    });
  });

  describe('changed reports', () => {
    const mockReports: Diff<Report> = {
      before: { ...MINIMAL_REPORT_MOCK, commit: mockCommits.before },
      after: { ...REPORT_MOCK, commit: mockCommits.after },
    };

    it('should create valid report diff', () => {
      const reportsDiff = compareReports(mockReports);
      expect(() => reportsDiffSchema.parse(reportsDiff)).not.toThrow();
    });

    it('should include commits from both reports', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.commits).toEqual(mockCommits);
    });

    it('should only have added categories (minimal report has none)', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.categories.added).toHaveLength(
        REPORT_MOCK.categories.length,
      );
      expect(reportsDiff.categories.removed).toHaveLength(0);
      expect(reportsDiff.categories.changed).toHaveLength(0);
      expect(reportsDiff.categories.unchanged).toHaveLength(0);
    });

    it('should only have added groups (minimal report has none)', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.groups.added).not.toHaveLength(0);
      expect(reportsDiff.groups.removed).toHaveLength(0);
      expect(reportsDiff.groups.changed).toHaveLength(0);
      expect(reportsDiff.groups.unchanged).toHaveLength(0);
    });

    it('should mark audits as added or removed when there is no overlap between reports', () => {
      const reportsDiff = compareReports(mockReports);
      expect(reportsDiff.audits.added).not.toHaveLength(0);
      expect(reportsDiff.audits.removed).not.toHaveLength(0);
      expect(reportsDiff.audits.changed).toHaveLength(0);
      expect(reportsDiff.audits.unchanged).toHaveLength(0);
    });
  });
});
