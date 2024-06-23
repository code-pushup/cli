import { vol } from 'memfs';
import { describe, expect, it } from 'vitest';
import { AuditReport, Issue, IssueSeverity, Report } from '@code-pushup/models';
import { MEMFS_VOLUME, REPORT_MOCK, reportMock } from '@code-pushup/test-utils';
import { SCORE_COLOR_RANGE } from './constants';
import { ScoredReport, SortableAuditReport, SortableGroup } from './types';
import {
  MARKERS,
  MarkerShape,
  applyScoreColor,
  calcDuration,
  colorByScoreDiff,
  compareAudits,
  compareCategoryAuditsAndGroups,
  compareIssueSeverity,
  compareIssues,
  countWeightedRefs,
  formatDiffNumber,
  formatReportScore,
  formatScoreWithColor,
  getPluginNameFromSlug,
  loadReport,
  scoreMarker,
  severityMarker,
  targetScoreIcon,
} from './utils';

describe('formatReportScore', () => {
  it.each([
    [0, '0'],
    [0.0049, '0'],
    [0.005, '1'],
    [0.01, '1'],
    [0.123, '12'],
    [0.99, '99'],
    [0.994, '99'],
    [0.995, '99'],
    [1, '100'],
  ] satisfies readonly [number, string][])(
    "should format a score of %d as '%s'",
    (score, expected) => {
      expect(formatReportScore(score)).toBe(expected);
    },
  );
});

describe('formatScoreWithColor', () => {
  it('should include colored circle and value multiplied by 100 in bold', () => {
    expect(formatScoreWithColor(1)).toBe('🟢 **100**');
  });

  it('should skip round value and optionally skip bold formatting', () => {
    expect(formatScoreWithColor(0.123)).toBe('🔴 **12**');
  });
});

describe('colorByScoreDiff', () => {
  it('should use green badge if score increased', () => {
    expect(colorByScoreDiff('🠋 −8 %', 0.03)).toMatch(/shields\.io.*-green/);
  });

  it('should use red badge if score dropped', () => {
    expect(colorByScoreDiff('🠉 +33 %', -1)).toMatch(/shields\.io.*-red/);
  });

  it("should use gray badge if score didn't change", () => {
    expect(colorByScoreDiff('🠉 +50 %', 0)).toMatch(/shields\.io.*-gray/);
  });
});

describe('formatDiffNumber', () => {
  it('should include plus sign for positive numbers', () => {
    expect(formatDiffNumber(5)).toBe('+5');
  });

  it('should include minus sign for negative numbers', () => {
    expect(formatDiffNumber(-1)).toBe('−1');
  });

  it('should use unicode symbol for positive infinity', () => {
    expect(formatDiffNumber(Number.POSITIVE_INFINITY)).toBe('+∞');
  });

  it('should use unicode symbol for negative infinity', () => {
    expect(formatDiffNumber(Number.NEGATIVE_INFINITY)).toBe('−∞');
  });
});

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
    const severityArr: IssueSeverity[] = ['error', 'info', 'warning'];
    expect([...severityArr].sort(compareIssueSeverity)).toEqual<
      IssueSeverity[]
    >(['info', 'warning', 'error']);
  });
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

describe('compareCategoryAuditsAndGroups', () => {
  it('should sort audits by weight and score', () => {
    const mockAudits = [
      { weight: 0, score: 0.1 },
      { weight: 5, score: 1 },
      { weight: 0, score: 0.7 },
      { weight: 10, score: 1 },
    ] as SortableAuditReport[];
    expect([...mockAudits].sort(compareCategoryAuditsAndGroups)).toEqual([
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
    ] as SortableAuditReport[];
    expect([...mockAudits].sort(compareCategoryAuditsAndGroups)).toEqual([
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
    ] as SortableAuditReport[];
    expect([...mockAudits].sort(compareCategoryAuditsAndGroups)).toEqual([
      { value: 1, title: 'c' },
      { value: 1, title: 'd' },
      { value: 0, title: 'a' },
      { value: 0, title: 'b' },
    ]);
  });

  it('should sort audits and groups together', () => {
    const mockAudits = [
      { weight: 1, score: 1, value: 100, title: 'audit A' },
      { weight: 1, score: 0, value: 0, title: 'audit B' },
      { weight: 1, score: 0, value: 5, title: 'audit C' },
    ] as SortableAuditReport[];
    const mockGroups = [
      { weight: 2, score: 1, title: 'group A' },
      { weight: 1, score: 1, title: 'group B' },
    ] as SortableGroup[];

    expect(
      [...mockAudits, ...mockGroups].sort(compareCategoryAuditsAndGroups),
    ).toEqual([
      { weight: 2, score: 1, title: 'group A' },
      { weight: 1, score: 0, value: 5, title: 'audit C' },
      { weight: 1, score: 0, value: 0, title: 'audit B' },
      { weight: 1, score: 1, value: 100, title: 'audit A' },
      { weight: 1, score: 1, title: 'group B' },
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
    ] as AuditReport[];
    const sortedAudits = [...mockAudits].sort(compareAudits);
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
    ] as AuditReport[];
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

describe('scoreMarker', () => {
  const {
    red: redCircle,
    yellow: yellowCircle,
    green: greenCircle,
  } = MARKERS.circle;
  const {
    red: redSquare,
    yellow: yellowSquare,
    green: greenSquare,
  } = MARKERS.square;

  it('should return circle by default', () => {
    expect(scoreMarker(0)).toBe(redCircle);
  });

  it.each<[string, MarkerShape | undefined]>([
    [redCircle, undefined],
    [redCircle, 'circle'],
    [redSquare, 'square'],
  ])('should return icon %s for marker type %s', (icon, type) => {
    expect(scoreMarker(0, type)).toBe(icon);
  });

  it.each<[string, number]>([
    [redCircle, 0],
    [redCircle, SCORE_COLOR_RANGE.YELLOW_MIN - 0.001],
    [yellowCircle, SCORE_COLOR_RANGE.YELLOW_MIN],
    [yellowCircle, SCORE_COLOR_RANGE.GREEN_MIN - 0.001],
    [greenCircle, SCORE_COLOR_RANGE.GREEN_MIN],
    [greenCircle, 1],
  ])(
    'should return circle icon %s for score %s if type is circle',
    (icon, score) => {
      expect(scoreMarker(score, 'circle')).toBe(icon);
    },
  );

  it.each<[string, number]>([
    [redSquare, 0],
    [redSquare, SCORE_COLOR_RANGE.YELLOW_MIN - 0.001],
    [yellowSquare, SCORE_COLOR_RANGE.YELLOW_MIN],
    [yellowSquare, SCORE_COLOR_RANGE.GREEN_MIN - 0.001],
    [greenSquare, SCORE_COLOR_RANGE.GREEN_MIN],
    [greenSquare, 1],
  ])(
    'should return circle icon %s for score %s if type is square',
    (icon, score) => {
      expect(scoreMarker(score, 'square')).toBe(icon);
    },
  );
});

describe('severityMarker', () => {
  it.each<[string, IssueSeverity]>([
    ['🚨', 'error'],
    ['⚠️', 'warning'],
    ['ℹ️', 'info'],
    ['ℹ️', '' as IssueSeverity],
  ])('should return icon %s for severity %s', (icon, severity) => {
    expect(severityMarker(severity)).toBe(icon);
  });
});

describe('applyScoreColor', () => {
  it.each<['red' | 'yellow' | 'green', number]>([
    ['red', 0],
    ['red', SCORE_COLOR_RANGE.YELLOW_MIN - 0.1],
    ['yellow', SCORE_COLOR_RANGE.YELLOW_MIN],
    ['yellow', SCORE_COLOR_RANGE.GREEN_MIN - 0.1],
    ['green', SCORE_COLOR_RANGE.GREEN_MIN],
    ['green', 1],
  ])('should return text with color %s for score %s', (methodName, score) => {
    const style = {
      red: vi.fn() as any,
      yellow: vi.fn() as any,
      green: vi.fn() as any,
    };
    applyScoreColor({ score, text: '●' }, style);
    expect(style[methodName]).toHaveBeenCalledWith('●');
  });

  it.each<['red' | 'yellow' | 'green', number]>([
    ['red', 0],
    ['red', SCORE_COLOR_RANGE.YELLOW_MIN - 0.1],
    ['yellow', SCORE_COLOR_RANGE.YELLOW_MIN],
    ['yellow', SCORE_COLOR_RANGE.GREEN_MIN - 0.1],
    ['green', SCORE_COLOR_RANGE.GREEN_MIN],
    ['green', 1],
  ])('should return score with color %s for score %s', (methodName, score) => {
    const style = {
      red: vi.fn() as any,
      yellow: vi.fn() as any,
      green: vi.fn() as any,
    };
    applyScoreColor({ score }, style);
    expect(style[methodName]).toHaveBeenCalledWith((score * 100).toString());
  });
});

describe('targetScoreIcon', () => {
  it('should return target score icon "✅" for passed score', () => {
    expect(targetScoreIcon(0.42, 0.4)).toBe('✅');
  });
  it('should return target score icon "❌" for failed score', () => {
    expect(targetScoreIcon(0.42, 0.5)).toBe('❌');
  });
  it('should return no target score icon if no targetScore is provided', () => {
    expect(targetScoreIcon(0.42)).toBe('');
  });
});
