import { vol } from 'memfs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { getPortalComparisonLink } from '@code-pushup/portal-client';
import {
  type Commit,
  type PersistConfig,
  type Report,
  reportsDiffSchema,
} from '@code-pushup/models';
import {
  COMMIT_ALT_MOCK,
  COMMIT_MOCK,
  MEMFS_VOLUME,
  MINIMAL_REPORT_MOCK,
  REPORT_MOCK,
  reportMock,
} from '@code-pushup/test-utils';
import { type Diff, fileExists, readJsonFile } from '@code-pushup/utils';
import { compareReportFiles, compareReports } from './compare.js';

describe('compareReportFiles', () => {
  const commitShas = {
    before: MINIMAL_REPORT_MOCK.commit!.hash,
    after: REPORT_MOCK.commit!.hash,
  };

  const persistConfig: Required<PersistConfig> = {
    outputDir: MEMFS_VOLUME,
    filename: 'report',
    format: ['json', 'md'],
  };

  beforeAll(() => {
    vi.spyOn(fs, 'readFile');
  });

  beforeEach(() => {
    vol.fromJSON(
      {
        'report-before.json': JSON.stringify(MINIMAL_REPORT_MOCK),
        'report-after.json': JSON.stringify(REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );
  });

  it('should read report files from default locations', async () => {
    await compareReportFiles({ persist: persistConfig });

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(MEMFS_VOLUME, 'report-before.json'),
    );
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(MEMFS_VOLUME, 'report-after.json'),
    );
  });

  it('should read report files from custom locations', async () => {
    vol.fromJSON(
      {
        '.code-pushup/.ci/.prev/report.json': JSON.stringify(REPORT_MOCK),
        '.code-pushup/.ci/.curr/report.json': JSON.stringify(REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );

    await compareReportFiles(
      { persist: persistConfig },
      {
        before: path.join(MEMFS_VOLUME, '.code-pushup/.ci/.prev/report.json'),
        after: path.join(MEMFS_VOLUME, '.code-pushup/.ci/.curr/report.json'),
      },
    );

    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(MEMFS_VOLUME, '.code-pushup/.ci/.prev/report.json'),
    );
    expect(fs.readFile).toHaveBeenCalledWith(
      path.join(MEMFS_VOLUME, '.code-pushup/.ci/.curr/report.json'),
    );
  });

  it('should create valid report-diff.json from report.json files', async () => {
    await compareReportFiles({ persist: persistConfig });

    const reportsDiffPromise = readJsonFile(
      path.join(MEMFS_VOLUME, 'report-diff.json'),
    );
    await expect(reportsDiffPromise).resolves.toBeTruthy();

    const reportsDiff = await reportsDiffPromise;
    expect(() => reportsDiffSchema.parse(reportsDiff)).not.toThrow();
  });

  it('should create all diff files specified by persist.format', async () => {
    await compareReportFiles({
      persist: {
        ...persistConfig,
        format: ['json', 'md'],
      },
    });

    await expect(
      fileExists(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.toBeTruthy();
    await expect(
      fileExists(path.join(MEMFS_VOLUME, 'report-diff.md')),
    ).resolves.toBeTruthy();
  });

  it('should include portal link (fetched using upload config) in Markdown file', async () => {
    await compareReportFiles({
      persist: persistConfig,
      upload: {
        server: 'https://api.code-pushup.dev/graphql',
        apiKey: 'cp_XXXXX',
        organization: 'dunder-mifflin',
        project: 'website',
      },
    });

    await expect(
      fs.readFile(path.join(MEMFS_VOLUME, 'report-diff.md'), 'utf8'),
    ).resolves.toContain(
      `[🕵️ See full comparison in Code PushUp portal 🔍](https://code-pushup.example.com/portal/dunder-mifflin/website/comparison/${commitShas.before}/${commitShas.after})`,
    );

    expect(getPortalComparisonLink).toHaveBeenCalledWith<
      Parameters<typeof getPortalComparisonLink>
    >({
      server: 'https://api.code-pushup.dev/graphql',
      apiKey: 'cp_XXXXX',
      parameters: {
        organization: 'dunder-mifflin',
        project: 'website',
        before: commitShas.before,
        after: commitShas.after,
      },
    });
  });

  it('should not include portal link in Markdown if upload config is missing', async () => {
    await compareReportFiles({ persist: persistConfig });

    await expect(
      fs.readFile(path.join(MEMFS_VOLUME, 'report-diff.md'), 'utf8'),
    ).resolves.not.toContain(
      '[🕵️ See full comparison in Code PushUp portal 🔍]',
    );

    expect(getPortalComparisonLink).not.toHaveBeenCalled();
  });

  it('should not include portal link in Markdown if report has no associated commits', async () => {
    vol.fromJSON(
      {
        'source-report.json': JSON.stringify({
          ...MINIMAL_REPORT_MOCK,
          commit: null,
        } satisfies Report),
        'target-report.json': JSON.stringify(REPORT_MOCK),
      },
      MEMFS_VOLUME,
    );
    await compareReportFiles(
      {
        persist: persistConfig,
        upload: {
          server: 'https://api.code-pushup.dev/graphql',
          apiKey: 'cp_XXXXX',
          organization: 'dunder-mifflin',
          project: 'website',
        },
      },
      {
        before: path.join(MEMFS_VOLUME, 'source-report.json'),
        after: path.join(MEMFS_VOLUME, 'target-report.json'),
      },
    );

    await expect(
      fs.readFile(path.join(MEMFS_VOLUME, 'report-diff.md'), 'utf8'),
    ).resolves.not.toContain(
      '[🕵️ See full comparison in Code PushUp portal 🔍]',
    );

    expect(getPortalComparisonLink).not.toHaveBeenCalled();
  });

  it('should include portal link in JSON file', async () => {
    await compareReportFiles({
      persist: persistConfig,
      upload: {
        server: 'https://api.code-pushup.dev/graphql',
        apiKey: 'cp_XXXXX',
        organization: 'dunder-mifflin',
        project: 'website',
      },
    });

    await expect(
      readJsonFile(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.toEqual(
      expect.objectContaining({
        portalUrl: `https://code-pushup.example.com/portal/dunder-mifflin/website/comparison/${commitShas.before}/${commitShas.after}`,
      }),
    );
  });

  it('should include label option in JSON file', async () => {
    await compareReportFiles(
      { persist: persistConfig },
      { label: 'backoffice' },
    );

    await expect(
      readJsonFile(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.toEqual(
      expect.objectContaining({
        label: 'backoffice',
      }),
    );
  });

  it('should include label if same in both report.json files', async () => {
    vol.fromJSON(
      {
        'report-before.json': JSON.stringify({
          ...MINIMAL_REPORT_MOCK,
          label: 'api',
        } satisfies Report),
        'report-after.json': JSON.stringify({
          ...REPORT_MOCK,
          label: 'api',
        } satisfies Report),
      },
      MEMFS_VOLUME,
    );

    await compareReportFiles({ persist: persistConfig });

    await expect(
      readJsonFile(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.toEqual(
      expect.objectContaining({
        label: 'api',
      }),
    );
  });

  it('should not include label if missing in report.json files', async () => {
    vol.fromJSON(
      {
        'report-before.json': JSON.stringify({
          ...MINIMAL_REPORT_MOCK,
          label: undefined,
        } satisfies Report),
        'report-after.json': JSON.stringify({
          ...REPORT_MOCK,
          label: undefined,
        } satisfies Report),
      },
      MEMFS_VOLUME,
    );

    await compareReportFiles({ persist: persistConfig });

    await expect(
      readJsonFile(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.not.toHaveProperty('label');
  });

  it('should not include label if it differs in report.json files', async () => {
    vol.fromJSON(
      {
        'report-before.json': JSON.stringify({
          ...MINIMAL_REPORT_MOCK,
          label: 'frontend',
        } satisfies Report),
        'report-after.json': JSON.stringify({
          ...REPORT_MOCK,
          label: 'backend',
        } satisfies Report),
      },
      MEMFS_VOLUME,
    );

    await compareReportFiles({ persist: persistConfig });

    await expect(
      readJsonFile(path.join(MEMFS_VOLUME, 'report-diff.json')),
    ).resolves.not.toHaveProperty('label');
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
        mockReport.categories!.length,
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
        REPORT_MOCK.categories!.length,
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
