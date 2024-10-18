import type { ReportsDiff } from '@code-pushup/models';
import {
  changesToDiffOutcomes,
  compareDiffsBy,
  formatPortalLink,
  formatTitle,
  mergeDiffOutcomes,
  sortChanges,
  summarizeDiffOutcomes,
  summarizeUnchanged,
} from './generate-md-reports-diff-utils';
import type { DiffOutcome } from './types';

describe('summarizeUnchanged', () => {
  it('should print unchanged array length with pluralized token and verb', () => {
    expect(
      summarizeUnchanged('category', { changed: [], unchanged: ['u1', 'u2'] }),
    ).toContain('2 categories are unchanged');
  });

  it('should print singular token and verb if unchanged array has 1 item', () => {
    expect(
      summarizeUnchanged('audit', { changed: [], unchanged: ['u1'] }),
    ).toContain('1 audit is unchanged');
  });

  it('should print as "other" unchanged if changed array is not empty', () => {
    expect(
      summarizeUnchanged('group', {
        changed: ['c1'],
        unchanged: ['u1', 'u2', 'u3'],
      }),
    ).toBe('3 other groups are unchanged.');
  });

  it('should print as "all" unchanged if changed array is empty', () => {
    expect(
      summarizeUnchanged('project', { changed: [], unchanged: ['u1', 'u2'] }),
    ).toBe('All of 2 projects are unchanged.');
  });
});

describe('summarizeDiffOutcomes', () => {
  it('should print status count with pluralized token', () => {
    expect(summarizeDiffOutcomes(['negative', 'negative'], 'group')).toBe(
      '👎 <strong>2</strong> groups regressed',
    );
  });

  it('should print counts per each diff status', () => {
    expect(
      summarizeDiffOutcomes(
        ['positive', 'negative', 'positive', 'negative', 'mixed', 'negative'],
        'audit',
      ),
    ).toBe(
      '👍 <strong>2</strong> audits improved, 👎 <strong>3</strong> audits regressed, <strong>1</strong> audit changed without impacting score',
    );
  });

  it('should skip unchanged status', () => {
    expect(summarizeDiffOutcomes(['unchanged', 'positive'], 'audit')).toBe(
      '👍 <strong>1</strong> audit improved',
    );
  });
});

describe('formatTitle', () => {
  it('should format title as link to docs', () => {
    expect(
      formatTitle({
        title: 'ESLint',
        docsUrl: 'https://eslint.org',
      }).toString(),
    ).toBe('[ESLint](https://eslint.org)');
  });

  it('should format title as plain text if docs not available', () => {
    expect(
      formatTitle({ title: 'Lighthouse', docsUrl: undefined }).toString(),
    ).toBe('Lighthouse');
  });
});

describe('formatPortalLink', () => {
  it('should format link to portal with text', () => {
    const text = formatPortalLink(
      'https://app.code-pushup.dev/portal/org/project/comparison/sha-1/sha-2',
    );
    expect(text).toBeDefined();
    expect(text!.toString()).toBe(
      '[🕵️ See full comparison in Code PushUp portal 🔍](https://app.code-pushup.dev/portal/org/project/comparison/sha-1/sha-2)',
    );
  });

  it('should not create link if not available', () => {
    expect(formatPortalLink(undefined)).toBeUndefined();
    expect(formatPortalLink('')).toBe('');
  });
});

describe('sortChanges', () => {
  it('should sort by absolute score diff', () => {
    expect(
      sortChanges([
        { slug: 'perf', scores: { diff: -0.05 } },
        { slug: 'a11y', scores: { diff: +0.11 } },
        { slug: 'i18n', scores: { diff: +0.02 } },
      ]),
    ).toEqual([
      { slug: 'a11y', scores: { diff: +0.11 } },
      { slug: 'perf', scores: { diff: -0.05 } },
      { slug: 'i18n', scores: { diff: +0.02 } },
    ]);
  });

  it('should sort by value diff if score diff is equal', () => {
    expect(
      sortChanges([
        { slug: 'npm-audit-prod', scores: { diff: 0 }, values: { diff: 0 } },
        { slug: 'npm-audit-dev', scores: { diff: -0.1 }, values: { diff: -3 } },
        { slug: 'line-coverage', scores: { diff: 0.2 }, values: { diff: 2 } },
        { slug: 'branch-coverage', scores: { diff: 0.1 }, values: { diff: 1 } },
      ]),
    ).toEqual([
      { slug: 'line-coverage', scores: { diff: 0.2 }, values: { diff: 2 } },
      { slug: 'npm-audit-dev', scores: { diff: -0.1 }, values: { diff: -3 } },
      { slug: 'branch-coverage', scores: { diff: 0.1 }, values: { diff: 1 } },
      { slug: 'npm-audit-prod', scores: { diff: 0 }, values: { diff: 0 } },
    ]);
  });
});

describe('changesToDiffOutcomes', () => {
  it('should derive status from only score diff', () => {
    expect(
      changesToDiffOutcomes([
        { scores: { diff: +0.05 } },
        { scores: { diff: -0.1 } },
        { scores: { diff: 0 } },
      ]),
    ).toEqual<DiffOutcome[]>(['positive', 'negative', 'unchanged']);
  });

  it('should derive status from score and value diff', () => {
    expect(
      changesToDiffOutcomes([
        { scores: { diff: +0.05 }, values: { diff: -150 } },
        { scores: { diff: -1 }, values: { diff: +5 } },
        { scores: { diff: 0 }, values: { diff: -1 } },
        { scores: { diff: 0 }, values: { diff: 0 } },
      ]),
    ).toEqual<DiffOutcome[]>(['positive', 'negative', 'mixed', 'unchanged']);
  });
});

describe('mergeDiffOutcomes', () => {
  it('should summarize as unchanged if all statuses are unchanged', () => {
    expect(
      mergeDiffOutcomes(['unchanged', 'unchanged', 'unchanged']),
    ).toBe<DiffOutcome>('unchanged');
  });

  it('should summarize as positive if only other statuses are unchanged', () => {
    expect(mergeDiffOutcomes(['unchanged', 'positive'])).toBe<DiffOutcome>(
      'positive',
    );
  });

  it('should summarize as negative if only other statuses are mixed or unchanged', () => {
    expect(
      mergeDiffOutcomes([
        'negative',
        'unchanged',
        'mixed',
        'negative',
        'unchanged',
      ]),
    ).toBe<DiffOutcome>('negative');
  });

  it('should summarize as mixed if both positive and negative statuses included', () => {
    expect(
      mergeDiffOutcomes(['positive', 'negative', 'positive']),
    ).toBe<DiffOutcome>('mixed');
  });

  it('should summarize as mixed if only other statuses are unchanged', () => {
    expect(
      mergeDiffOutcomes(['unchanged', 'unchanged', 'mixed', 'unchanged']),
    ).toBe<DiffOutcome>('mixed');
  });
});

describe('compareDiffsBy', () => {
  it('should sort by sum of category score changes', () => {
    const diffs = [
      {
        categories: {
          changed: [{ scores: { diff: +0.12 } }],
        },
      },
      {
        categories: {
          changed: [{ scores: { diff: -0.05 } }, { scores: { diff: +0.1 } }],
        },
      },
      {
        categories: {
          changed: [{ scores: { diff: +0.01 } }, { scores: { diff: +0.03 } }],
        },
      },
    ] as ReportsDiff[];
    expect(
      diffs.toSorted((a, b) => compareDiffsBy('categories', a, b)),
    ).toEqual([diffs[1], diffs[0], diffs[2]]);
  });

  it('should sort by sum of audit score changes, then by sum of added/removed', () => {
    const diffs = [
      {
        audits: {
          changed: [{ scores: { diff: +0.1 } }],
          added: [] as ReportsDiff['audits']['added'],
          removed: [] as ReportsDiff['audits']['removed'],
        },
      },
      {
        audits: {
          changed: [{ scores: { diff: +0.42 } }],
          added: [],
          removed: [],
        },
      },
      {
        audits: {
          changed: [{ scores: { diff: -0.1 } }],
          added: [],
          removed: [{}],
        },
      },
      {
        audits: {
          changed: [{ scores: { diff: +0.05 } }, { scores: { diff: -0.05 } }],
          added: [{}, {}],
          removed: [],
        },
      },
    ] as ReportsDiff[];
    expect(diffs.toSorted((a, b) => compareDiffsBy('audits', a, b))).toEqual([
      diffs[1],
      diffs[3],
      diffs[2],
      diffs[0],
    ]);
  });
});
