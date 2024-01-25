import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { Issue, IssueSeverity, Report } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  REPORT_MOCK,
  reportMock,
} from '@code-pushup/testing-utils';
import {
  EnrichedAuditReport,
  ScoredReport,
  WeighedAuditReport,
} from './scoring';
import {
  calcDuration,
  compareAudits,
  compareCategoryAudits,
  compareIssueSeverity,
  compareIssues,
  countWeightedRefs,
  formatReportScore,
  getPluginNameFromSlug,
  loadReport,
} from './utils';

describe('calcDuration', () => {
  it('should calculate the duration correctly if start and stop are given', () => {
    const start = performance.now();
    const stop = start + 100;
    expect(calcDuration(start, stop)).toBe(100);
  });

  it('should calculate the duration correctly if only start is given', () => {
    const start = performance.now();
    expect(calcDuration(start)).toBe(0);
  });
});

describe('countWeightedRefs', () => {
  it('should include weighted references only', () => {
    expect(
      countWeightedRefs([
        {
          slug: 'a1',
          weight: 0,
          plugin: 'a',
          type: 'audit',
        },
        {
          slug: 'a2',
          weight: 1,
          plugin: 'a',
          type: 'audit',
        },
      ]),
    ).toBe(1);
  });
});

describe('compareIssueSeverity', () => {
  it('should order severities in logically ascending order when used as compareFn with .sort()', () => {
    const severityArr = ['error', 'info', 'warning'] satisfies IssueSeverity[];
    expect([...severityArr].sort(compareIssueSeverity)).toEqual([
      'info',
      'warning',
      'error',
    ]);
  });
});

describe('formatReportScore', () => {
  it.each([
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'Infinity'],
    [Number.NEGATIVE_INFINITY, '-Infinity'],
    [-1, '-100'],
    [-0.1, '-10'],
    [0, '0'],
    [0.0049, '0'],
    [0.005, '1'],
    [0.01, '1'],
    [0.123, '12'],
    [0.245, '25'],
    [0.2449, '24'],
    [0.99, '99'],
    [0.994, '99'],
    [0.995, '100'],
    [1, '100'],
    [1.1, '110'],
  ] satisfies readonly [number, string][])(
    "should format a score of %d as '%s'",
    (score, expected) => {
      expect(formatReportScore(score)).toBe(expected);
    },
  );
});

describe('loadReport', () => {
  it('should load a valid JSON report', async () => {
    vol.fromJSON(
      {
        [`report.json`]: JSON.stringify(reportMock()),
        [`report.md`]: 'test-42',
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        filename: 'report',
        format: 'json',
      }),
    ).resolves.toEqual(reportMock());
  });

  it('should load a markdown file', async () => {
    vol.fromJSON(
      {
        [`report.dummy.md`]: 'test-7',
        [`report.json`]: '{"test":42}',
        [`report.md`]: 'test-42',
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        format: 'md',
        filename: 'report',
      }),
    ).resolves.toBe('test-42');
  });

  it('should throw for an invalid JSON report', async () => {
    vol.fromJSON(
      {
        [`report.json`]: JSON.stringify({
          ...REPORT_MOCK,
          plugins: [{ ...REPORT_MOCK.plugins[0]!, slug: '-Invalid_slug' }],
        } satisfies Report),
      },
      MEMFS_VOLUME,
    );

    await expect(
      loadReport({
        outputDir: MEMFS_VOLUME,
        filename: 'report',
        format: 'json',
      }),
    ).rejects.toThrow('slug has to follow the pattern');
  });
});

describe('sortCategoryAudits', () => {
  it('should sort audits by weight and score', () => {
    const mockAudits = [
      { weight: 0, score: 0.1 },
      { weight: 5, score: 1 },
      { weight: 0, score: 0.7 },
      { weight: 10, score: 1 },
    ] as WeighedAuditReport[];
    const sortedAudits = [...mockAudits].sort(compareCategoryAudits);
    expect(sortedAudits).toEqual([
      { weight: 10, score: 1 },
      { weight: 5, score: 1 },
      { weight: 0, score: 0.1 },
      { weight: 0, score: 0.7 },
    ]);
  });

  it('should sort audits by score and value', () => {
    const mockAudits = [
      { score: 0.7, value: 1 },
      { score: 1, value: 1 },
      { score: 0.7, value: 0 },
      { score: 0, value: 1 },
    ] as WeighedAuditReport[];
    const sortedAudits = [...mockAudits].sort(compareCategoryAudits);
    expect(sortedAudits).toEqual([
      { score: 0, value: 1 },
      { score: 0.7, value: 1 },
      { score: 0.7, value: 0 },
      { score: 1, value: 1 },
    ]);
  });

  it('should sort audits by value and title', () => {
    const mockAudits = [
      { value: 1, title: 'c' },
      { value: 0, title: 'b' },
      { value: 0, title: 'a' },
      { value: 1, title: 'd' },
    ] as WeighedAuditReport[];
    const sortedAudits = [...mockAudits].sort(compareCategoryAudits);
    expect(sortedAudits).toEqual([
      { value: 1, title: 'c' },
      { value: 1, title: 'd' },
      { value: 0, title: 'a' },
      { value: 0, title: 'b' },
    ]);
  });
});

describe('sortAudits', () => {
  it('should sort audits by score and value', () => {
    const mockAudits = [
      { score: 0.7, value: 1 },
      { score: 1, value: 1 },
      { score: 0.7, value: 0 },
      { score: 0, value: 1 },
    ] as EnrichedAuditReport[];
    const sortedAudits = [...mockAudits].sort(compareAudits);
    expect(sortedAudits).toEqual([
      { score: 0, value: 1 },
      { score: 0.7, value: 1 },
      { score: 0.7, value: 0 },
      { score: 1, value: 1 },
    ]);
  });

  it('should sort audits by value and title', () => {
    const mockAudits: EnrichedAuditReport[] = [
      { value: 1, title: 'c' },
      { value: 0, title: 'b' },
      { value: 0, title: 'a' },
      { value: 1, title: 'd' },
    ] as EnrichedAuditReport[];
    const sortedAudits = [...mockAudits].sort(compareAudits);
    expect(sortedAudits).toEqual([
      { value: 1, title: 'c' },
      { value: 1, title: 'd' },
      { value: 0, title: 'a' },
      { value: 0, title: 'b' },
    ]);
  });
});

describe('getPluginNameFromSlug', () => {
  it('should return plugin name', () => {
    const plugins = [
      { slug: 'plugin-a', title: 'Plugin A' },
      { slug: 'plugin-b', title: 'Plugin B' },
    ] as ScoredReport['plugins'];
    expect(getPluginNameFromSlug('plugin-a', plugins)).toBe('Plugin A');
    expect(getPluginNameFromSlug('plugin-b', plugins)).toBe('Plugin B');
  });
});

describe('sortAuditIssues', () => {
  it('should sort issues by severity and source file', () => {
    const mockIssues = [
      { severity: 'warning', source: { file: 'b' } },
      { severity: 'error', source: { file: 'c' } },
      { severity: 'error', source: { file: 'a' } },
      { severity: 'info', source: { file: 'b' } },
    ] as Issue[];
    const sortedIssues = [...mockIssues].sort(compareIssues);
    expect(sortedIssues).toEqual([
      { severity: 'error', source: { file: 'a' } },
      { severity: 'error', source: { file: 'c' } },
      { severity: 'warning', source: { file: 'b' } },
      { severity: 'info', source: { file: 'b' } },
    ]);
  });

  it('should sort issues by source file and source start line', () => {
    const mockIssues = [
      { severity: 'info', source: { file: 'b', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'c', position: { startLine: 1 } } },
      { severity: 'info', source: { file: 'a', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'b', position: { startLine: 1 } } },
    ] as Issue[];
    const sortedIssues = [...mockIssues].sort(compareIssues);
    expect(sortedIssues).toEqual([
      { severity: 'info', source: { file: 'a', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'b', position: { startLine: 1 } } },
      { severity: 'info', source: { file: 'b', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'c', position: { startLine: 1 } } },
    ]);
  });

  it('should sort issues without source on top of same severity', () => {
    const mockIssues = [
      { severity: 'info', source: { file: 'b', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'c', position: { startLine: 1 } } },
      {
        severity: 'warning',
        source: { file: 'a', position: { startLine: 2 } },
      },
      { severity: 'info', source: { file: 'b', position: { startLine: 1 } } },
      { severity: 'info', source: { file: 'b' } },
      { severity: 'error' },
    ] as Issue[];
    const sortedIssues = [...mockIssues].sort(compareIssues);
    expect(sortedIssues).toEqual([
      { severity: 'error' },
      {
        severity: 'warning',
        source: { file: 'a', position: { startLine: 2 } },
      },
      { severity: 'info', source: { file: 'b' } },
      { severity: 'info', source: { file: 'b', position: { startLine: 1 } } },
      { severity: 'info', source: { file: 'b', position: { startLine: 2 } } },
      { severity: 'info', source: { file: 'c', position: { startLine: 1 } } },
    ]);
  });
});
