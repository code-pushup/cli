import type { Ansis } from 'ansis';
import { type Mock, describe, expect, it } from 'vitest';
import type { AuditReport, Issue, IssueSeverity } from '@code-pushup/models';
import { SCORE_COLOR_RANGE } from './constants.js';
import type {
  ScoredReport,
  SortableAuditReport,
  SortableGroup,
} from './types.js';
import {
  MARKERS,
  type MarkerShape,
  applyScoreColor,
  calcDuration,
  colorByScoreDiff,
  compareAudits,
  compareCategoryAuditsAndGroups,
  compareIssueSeverity,
  compareIssues,
  countCategoryAudits,
  countWeightedRefs,
  formatDiffNumber,
  formatReportScore,
  formatScoreChange,
  formatScoreWithColor,
  formatValueChange,
  getPluginNameFromSlug,
  roundValue,
  scoreFilter,
  scoreMarker,
  severityMarker,
  targetScoreIcon,
} from './utils.js';

describe('scoreFilter', () => {
  it('should not filter by score if no options are passed', () => {
    expect(scoreFilter()({ score: 0 })).toBe(true);
  });

  it('should filter by score if options are passed', () => {
    expect(
      scoreFilter({ isScoreListed: score => score === 0.5 })({ score: 0 }),
    ).toBe(false);
  });
});

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
    expect(formatScoreWithColor(1).toString()).toBe('🟢 **100**');
  });

  it('should skip round value and optionally skip bold formatting', () => {
    expect(formatScoreWithColor(0.123).toString()).toBe('🔴 **12**');
  });

  it('should skip bold formatting', () => {
    expect(formatScoreWithColor(0.123, { skipBold: true }).toString()).toBe(
      '🔴 12',
    );
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

  it('should include multiple weighted references', () => {
    expect(
      countWeightedRefs([
        {
          slug: 'a1',
          weight: 0.5,
          plugin: 'a',
          type: 'audit',
        },
        {
          slug: 'a2',
          weight: 0.3,
          plugin: 'a',
          type: 'audit',
        },
        {
          slug: 'a3',
          weight: 0.2,
          plugin: 'a',
          type: 'audit',
        },
      ]),
    ).toBe(1);
  });

  it('should return 0 when all weights are 0', () => {
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
          weight: 0,
          plugin: 'a',
          type: 'audit',
        },
      ]),
    ).toBe(0);
  });

  it('should handle cases when no weights are provided', () => {
    expect(countWeightedRefs([])).toBe(0);
  });
});

describe('compareIssueSeverity', () => {
  it('should order severities in logically ascending order when used as compareFn with .sort()', () => {
    const severityArr: IssueSeverity[] = ['error', 'info', 'warning'];
    expect(severityArr.toSorted(compareIssueSeverity)).toEqual<IssueSeverity[]>(
      ['info', 'warning', 'error'],
    );
  });
});

describe('compareCategoryAuditsAndGroups', () => {
  it('should sort audits by score and weight', () => {
    const mockAudits = [
      { weight: 0, score: 0.1 },
      { weight: 5, score: 1 },
      { weight: 0, score: 0.7 },
      { weight: 10, score: 1 },
    ] as SortableAuditReport[];
    expect(mockAudits.toSorted(compareCategoryAuditsAndGroups)).toEqual([
      { weight: 0, score: 0.1 },
      { weight: 0, score: 0.7 },
      { weight: 10, score: 1 },
      { weight: 5, score: 1 },
    ]);
  });

  it('should sort audits by score and value', () => {
    const mockAudits = [
      { score: 0.7, value: 1 },
      { score: 1, value: 1 },
      { score: 0.7, value: 0 },
      { score: 0, value: 1 },
    ] as SortableAuditReport[];
    expect(mockAudits.toSorted(compareCategoryAuditsAndGroups)).toEqual([
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
    expect(mockAudits.toSorted(compareCategoryAuditsAndGroups)).toEqual([
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
      { weight: 1, score: 0, value: 5, title: 'audit C' },
      { weight: 1, score: 0, value: 0, title: 'audit B' },
      { weight: 2, score: 1, title: 'group A' },
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
    const sortedAudits = mockAudits.toSorted(compareAudits);
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
    const sortedAudits = mockAudits.toSorted(compareAudits);
    expect(sortedAudits).toEqual([
      { value: 1, title: 'c' },
      { value: 1, title: 'd' },
      { value: 0, title: 'a' },
      { value: 0, title: 'b' },
    ]);
  });
});

describe('getPluginNameFromSlug', () => {
  it('should return plugin title', () => {
    const plugins = [
      { slug: 'plugin-a', title: 'Plugin A' },
      { slug: 'plugin-b', title: 'Plugin B' },
    ] as ScoredReport['plugins'];
    expect(getPluginNameFromSlug('plugin-a', plugins)).toBe('Plugin A');
    expect(getPluginNameFromSlug('plugin-b', plugins)).toBe('Plugin B');
  });

  it('should return plugin slug when plugin title is an empty string', () => {
    expect(
      getPluginNameFromSlug('plugin-a', [
        { slug: 'plugin-a', title: '' },
      ] as ScoredReport['plugins']),
    ).toBe('plugin-a');
  });

  it('should return provided slug when plugin slug and title are empty strings', () => {
    expect(
      getPluginNameFromSlug('plugin-a', [
        { slug: '', title: '' },
      ] as ScoredReport['plugins']),
    ).toBe('plugin-a');
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
    const sortedIssues = mockIssues.toSorted(compareIssues);
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
    const sortedIssues = mockIssues.toSorted(compareIssues);
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
    const sortedIssues = mockIssues.toSorted(compareIssues);
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
  const ansisMock = {
    red: vi.fn() as any,
    yellow: vi.fn() as any,
    green: vi.fn() as any,
    bold: vi.fn() as any,
  } as Ansis;

  afterEach(() => {
    Object.values(ansisMock).forEach((mock: Mock) => {
      mock.mockRestore();
    });
  });

  it.each<['red' | 'yellow' | 'green', number]>([
    ['red', 0],
    ['red', SCORE_COLOR_RANGE.YELLOW_MIN - 0.1],
    ['yellow', SCORE_COLOR_RANGE.YELLOW_MIN],
    ['yellow', SCORE_COLOR_RANGE.GREEN_MIN - 0.1],
    ['green', SCORE_COLOR_RANGE.GREEN_MIN],
    ['green', 1],
  ])('should return text with color %s for score %s', (methodName, score) => {
    applyScoreColor({ score, text: '●' }, ansisMock);
    expect(ansisMock[methodName]).toHaveBeenCalledWith('●');
  });

  it.each<['red' | 'yellow' | 'green', number]>([
    ['red', 0],
    ['red', SCORE_COLOR_RANGE.YELLOW_MIN - 0.1],
    ['yellow', SCORE_COLOR_RANGE.YELLOW_MIN],
    ['yellow', SCORE_COLOR_RANGE.GREEN_MIN - 0.1],
    ['green', SCORE_COLOR_RANGE.GREEN_MIN],
    ['green', 1],
  ])('should return score with color %s for score %s', (methodName, score) => {
    applyScoreColor({ score }, ansisMock);
    expect(ansisMock[methodName]).toHaveBeenCalledWith(
      (score * 100).toString(),
    );
  });
});

describe('targetScoreIcon', () => {
  it('should return target score icon "✅" for passed score', () => {
    expect(targetScoreIcon(0.42, 0.4)).toBe('✅');
  });

  it('should return target score icon "❌" for failed score', () => {
    expect(targetScoreIcon(0.42, 0.5)).toBe('❌');
  });

  it('should return prefixed target score icon if prefix is provided', () => {
    expect(
      targetScoreIcon(0.42, 0.1, {
        prefix: '<',
      }),
    ).toBe('<✅');
  });

  it('should return prefixed target score icon if postfix is provided', () => {
    expect(
      targetScoreIcon(0.42, 0.1, {
        postfix: '>',
      }),
    ).toBe('✅>');
  });

  it('should return pre and postfixed target score icon if both are provided', () => {
    expect(
      targetScoreIcon(0.42, 0.1, {
        prefix: '<',
        postfix: '>',
      }),
    ).toBe('<✅>');
  });

  it('should return no target score icon if no targetScore is provided', () => {
    expect(targetScoreIcon(0.42)).toBe('');
  });
});

describe('roundValue', () => {
  it.each([
    [0, 0],
    [-40, -40],
    [1.525, 1.5],
    [-0.725, -0.7],
    [0.2, 0.2],
    [-0.000_02, -0.1],
  ])('should round value %d to %d', (input, expected) => {
    expect(roundValue(input)).toBe(expected);
  });
});

describe('formatScoreChange', () => {
  it.each([
    [-0.4, '↓ −40'],
    [0.015, '↑ +1.5'],
    [-0.007, '↓ −0.7'],
    [0.002, '↑ +0.2'],
    [-0.000_000_2, '↓ −0.1'],
  ])(
    'should round and format raw score diff %d to be score change %s',
    (diff, scoreChange) => {
      expect(formatScoreChange(diff)).toHaveProperty('alt', scoreChange);
    },
  );
});

describe('formatValueChange', () => {
  it.each([
    [{ before: 600, after: 450, diff: -150 }, '↓ −25 %'],
    [{ before: 1, after: 3, diff: 2 }, '↑ +200 %'],
    [{ before: 0, after: 2, diff: 2 }, '↑ +∞ %'],
    [{ before: 0, after: -2, diff: -2 }, '↓ −∞ %'],
    [{ before: 100, after: 101, diff: 1 }, '↑ +1 %'],
    [{ before: 1000, after: 1001, diff: 1 }, '↑ +0.1 %'],
    [{ before: 500, after: 499, diff: -1 }, '↓ −0.2 %'],
    [{ before: 123_456, after: 123_498, diff: 42 }, '↑ +0.1 %'],
  ])(
    'should round and format raw value diff %o to be value change %s',
    (diff, valueChange) => {
      expect(
        formatValueChange({
          values: diff,
          scores: { before: 0, after: 0, diff: 0 },
        }),
      ).toHaveProperty('alt', valueChange);
    },
  );
});

describe('countCategoryAudits', () => {
  it('should count single audit references', () => {
    expect(
      countCategoryAudits(
        [
          {
            type: 'audit',
            plugin: 'coverage',
            slug: 'function-coverage',
            weight: 1,
          },
        ],
        [],
      ),
    ).toBe(1);
  });

  it('should count audits in a group', () => {
    expect(
      countCategoryAudits(
        [
          {
            type: 'group',
            plugin: 'coverage',
            slug: 'code-coverage',
            weight: 1,
          },
        ],
        [
          {
            slug: 'coverage',
            groups: [
              {
                slug: 'code-coverage',
                refs: [
                  { slug: 'branch-coverage', weight: 0.33 },
                  { slug: 'function-coverage', weight: 0.33 },
                  { slug: 'line-coverage', weight: 0.33 },
                ],
              },
            ],
          },
        ] as ScoredReport['plugins'],
      ),
    ).toBe(3);
  });

  it('should handle mixed audit and group references', () => {
    expect(
      countCategoryAudits(
        [
          {
            type: 'audit',
            plugin: 'lighthouse',
            slug: 'is-on-https',
            weight: 1,
          },
          {
            type: 'group',
            plugin: 'coverage',
            slug: 'code-coverage',
            weight: 1,
          },
        ],
        [
          {
            slug: 'coverage',
            groups: [
              {
                slug: 'code-coverage',
                refs: [
                  { slug: 'branch-coverage', weight: 0.5 },
                  { slug: 'line-coverage', weight: 0.5 },
                ],
              },
            ],
          },
        ] as ScoredReport['plugins'],
      ),
    ).toBe(3);
  });

  it('should return 0 when a group is not found', () => {
    expect(
      countCategoryAudits(
        [
          {
            type: 'group',
            plugin: 'plugin-A',
            slug: 'missing-group',
            weight: 1,
          },
        ],
        [
          {
            slug: 'plugin-A',
            groups: [
              {
                slug: 'code-coverage',
                refs: [
                  { slug: 'branch-coverage', weight: 0.5 },
                  { slug: 'line-coverage', weight: 0.5 },
                ],
              },
            ],
          },
        ] as ScoredReport['plugins'],
      ),
    ).toBe(0);
  });

  it.each([[[]], [undefined]])(
    'should return 0 when plugin groups are %p and no single audit references are provided',
    groups => {
      expect(
        countCategoryAudits(
          [
            {
              type: 'group',
              plugin: 'coverage',
              slug: 'code-coverage',
              weight: 1,
            },
          ],
          [{ slug: 'coverage', groups }] as ScoredReport['plugins'],
        ),
      ).toBe(0);
    },
  );

  it('should return 0 when no audits or groups are present', () => {
    expect(countCategoryAudits([], [])).toBe(0);
  });
});
