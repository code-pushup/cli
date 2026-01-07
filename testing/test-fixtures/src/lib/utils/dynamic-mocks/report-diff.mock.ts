import type {
  AuditDiff,
  AuditResult,
  CategoryDiff,
  ReportsDiff,
} from '@code-pushup/models';
import { COMMIT_ALT_MOCK, COMMIT_MOCK } from '../commit.mock.js';
import {
  CATEGORIES_MAP,
  CATEGORY_SLUGS,
  type CategorySlug,
} from './categories.mock.js';
import {
  ESLINT_AUDITS_FIXED_SLUGS,
  ESLINT_AUDITS_MAP,
  ESLINT_AUDIT_SLUGS,
} from './eslint-audits.mock.js';
import {
  ESLINT_PLUGIN_GROUP_MAX_LINES,
  ESLINT_PLUGIN_META,
  type ESLintAuditSlug,
} from './eslint-plugin.mock.js';
import {
  LIGHTHOUSE_AUDITS_CHANGES,
  LIGHTHOUSE_AUDITS_MAP,
  LIGHTHOUSE_AUDIT_SLUGS,
} from './lighthouse-audits.mock.js';
import {
  LH_PLUGIN_GROUP_PERFORMANCE,
  LH_PLUGIN_META,
} from './lighthouse-plugin.mock.js';

export function reportsDiffMock(): ReportsDiff {
  return {
    commits: {
      before: COMMIT_MOCK,
      after: COMMIT_ALT_MOCK,
    },
    categories: {
      changed: CATEGORY_SLUGS.map(slug => {
        const category = CATEGORIES_MAP[slug];
        return {
          slug,
          title: category.title,
          ...('docsUrl' in category && {
            docsUrl: category.docsUrl,
          }),
          scores: categoryScores(slug),
        };
      }),
      unchanged: [],
      added: [],
      removed: [],
    },
    groups: {
      changed: [
        {
          slug: ESLINT_PLUGIN_GROUP_MAX_LINES.slug,
          title: ESLINT_PLUGIN_GROUP_MAX_LINES.title,
          plugin: {
            slug: ESLINT_PLUGIN_META.slug,
            title: ESLINT_PLUGIN_META.title,
            docsUrl: ESLINT_PLUGIN_META.docsUrl,
          },
          scores: { before: 0.5, after: 1, diff: 0.5 },
        },
        {
          slug: LH_PLUGIN_GROUP_PERFORMANCE.slug,
          title: LH_PLUGIN_GROUP_PERFORMANCE.title,
          plugin: { slug: LH_PLUGIN_META.slug, title: LH_PLUGIN_META.title },
          scores: { before: 0.92, after: 0.94, diff: 0.02 },
        },
      ],
      unchanged: [],
      added: [],
      removed: [],
    },
    audits: {
      changed: [
        ...ESLINT_AUDITS_FIXED_SLUGS.map(
          (slug): AuditDiff => ({
            slug,
            title: ESLINT_AUDITS_MAP[slug].title,
            docsUrl: ESLINT_AUDITS_MAP[slug].docsUrl,
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
              docsUrl: ESLINT_PLUGIN_META.docsUrl,
            },
            scores: toNumberComparison({
              before: ESLINT_AUDITS_MAP[slug].score,
              after: 1,
            }),
            values: toNumberComparison({
              before: ESLINT_AUDITS_MAP[slug].value,
              after: 0,
            }),
            displayValues: {
              before: ESLINT_AUDITS_MAP[slug].displayValue,
              after: 'passed',
            },
          }),
        ),
        ...LIGHTHOUSE_AUDIT_SLUGS.filter(
          slug => slug in LIGHTHOUSE_AUDITS_CHANGES,
        ).map(
          (slug): AuditDiff => ({
            slug,
            title: LIGHTHOUSE_AUDITS_MAP[slug].title,
            docsUrl: LIGHTHOUSE_AUDITS_MAP[slug].docsUrl,
            plugin: {
              slug: LH_PLUGIN_META.slug,
              title: LH_PLUGIN_META.title,
            },
            scores: toNumberComparison({
              before: LIGHTHOUSE_AUDITS_MAP[slug].score,
              after: LIGHTHOUSE_AUDITS_CHANGES[slug]!.score,
            }),
            values: toNumberComparison({
              before: LIGHTHOUSE_AUDITS_MAP[slug].value,
              after: LIGHTHOUSE_AUDITS_CHANGES[slug]!.value,
            }),
            displayValues: {
              before: LIGHTHOUSE_AUDITS_MAP[slug].displayValue,
              after: LIGHTHOUSE_AUDITS_CHANGES[slug]!.displayValue,
            },
          }),
        ),
      ],
      unchanged: [
        ...ESLINT_AUDIT_SLUGS.filter(
          slug => !ESLINT_AUDITS_FIXED_SLUGS.includes(slug),
        ).map(
          (slug): AuditResult => ({
            slug,
            title: ESLINT_AUDITS_MAP[slug].title,
            docsUrl: ESLINT_AUDITS_MAP[slug].docsUrl,
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
              docsUrl: ESLINT_PLUGIN_META.docsUrl,
            },
            score: ESLINT_AUDITS_MAP[slug].score,
            value: ESLINT_AUDITS_MAP[slug].value,
            displayValue: ESLINT_AUDITS_MAP[slug].displayValue,
          }),
        ),
        ...LIGHTHOUSE_AUDIT_SLUGS.filter(
          slug => !(slug in LIGHTHOUSE_AUDITS_CHANGES),
        ).map(
          (slug): AuditResult => ({
            slug,
            title: LIGHTHOUSE_AUDITS_MAP[slug].title,
            docsUrl: LIGHTHOUSE_AUDITS_MAP[slug].docsUrl,
            plugin: { slug: LH_PLUGIN_META.slug, title: LH_PLUGIN_META.title },
            score: LIGHTHOUSE_AUDITS_MAP[slug].score,
            value: LIGHTHOUSE_AUDITS_MAP[slug].value,
            displayValue: LIGHTHOUSE_AUDITS_MAP[slug].displayValue,
          }),
        ),
      ],
      added: [],
      removed: [],
    },
    date: '2024-03-12T17:15:34.831Z',
    duration: 105,
    packageName: '@code-pushup/core',
    version: '1.0.0',
  };
}

export function reportsDiffAltMock(): ReportsDiff {
  const originalDiff = reportsDiffMock();
  return {
    ...originalDiff,
    categories: {
      changed: [
        {
          slug: 'performance' satisfies CategorySlug,
          title: CATEGORIES_MAP['performance'].title,
          scores: { before: 0.92, after: 0.94, diff: 0.02 },
        },
        {
          slug: 'bug-prevention' satisfies CategorySlug,
          title: CATEGORIES_MAP['bug-prevention'].title,
          scores: { before: 0.68, after: 0.6795, diff: -0.0005 },
        },
      ],
      unchanged: [
        {
          slug: 'code-style' satisfies CategorySlug,
          title: CATEGORIES_MAP['code-style'].title,
          score: 0.54,
        },
      ],
      added: [],
      removed: [],
    },
    groups: {
      changed: [
        {
          slug: LH_PLUGIN_GROUP_PERFORMANCE.slug,
          title: LH_PLUGIN_GROUP_PERFORMANCE.title,
          plugin: { slug: LH_PLUGIN_META.slug, title: LH_PLUGIN_META.title },
          scores: { before: 0.92, after: 0.94, diff: 0.02 },
        },
      ],
      unchanged: [
        {
          slug: ESLINT_PLUGIN_GROUP_MAX_LINES.slug,
          title: ESLINT_PLUGIN_GROUP_MAX_LINES.title,
          plugin: {
            slug: ESLINT_PLUGIN_META.slug,
            title: ESLINT_PLUGIN_META.title,
          },
          score: 0.5,
        },
      ],
      added: [],
      removed: [],
    },
    audits: {
      changed: [
        {
          slug: 'no-unused-vars' satisfies ESLintAuditSlug,
          title: ESLINT_AUDITS_MAP['no-unused-vars'].title,
          docsUrl: ESLINT_AUDITS_MAP['no-unused-vars'].docsUrl,
          plugin: {
            slug: ESLINT_PLUGIN_META.slug,
            title: ESLINT_PLUGIN_META.title,
            docsUrl: ESLINT_PLUGIN_META.docsUrl,
          },
          scores: { before: 1, after: 0, diff: -1 },
          values: { before: 0, after: 1, diff: 1 },
          displayValues: { before: 'passed', after: '1 error' },
        },
        ...originalDiff.audits.changed.filter(
          ({ plugin }) => plugin.slug === 'lighthouse',
        ),
      ],
      unchanged: [
        ...ESLINT_AUDIT_SLUGS.filter(slug => slug !== 'no-unused-vars').map(
          (slug): AuditResult => ({
            slug,
            title: ESLINT_AUDITS_MAP[slug].title,
            docsUrl: ESLINT_AUDITS_MAP[slug].docsUrl,
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
              docsUrl: ESLINT_PLUGIN_META.docsUrl,
            },
            score: ESLINT_AUDITS_MAP[slug].score,
            value: ESLINT_AUDITS_MAP[slug].value,
            displayValue: ESLINT_AUDITS_MAP[slug].displayValue,
          }),
        ),
        ...originalDiff.audits.unchanged.filter(
          ({ plugin }) => plugin.slug === 'lighthouse',
        ),
      ],
      added: [],
      removed: [],
    },
  };
}

export function reportsDiffUnchangedMock(): ReportsDiff {
  return {
    ...reportsDiffMock(),
    categories: {
      changed: [],
      unchanged: CATEGORY_SLUGS.map(slug => ({
        slug,
        title: CATEGORIES_MAP[slug].title,
        score: categoryScores(slug).before,
      })),
      added: [],
      removed: [],
    },
    groups: {
      changed: [],
      unchanged: [
        {
          slug: ESLINT_PLUGIN_GROUP_MAX_LINES.slug,
          title: ESLINT_PLUGIN_GROUP_MAX_LINES.title,
          plugin: {
            slug: ESLINT_PLUGIN_META.slug,
            title: ESLINT_PLUGIN_META.title,
            docsUrl: ESLINT_PLUGIN_META.docsUrl,
          },
          score: 0.5,
        },
        {
          slug: LH_PLUGIN_GROUP_PERFORMANCE.slug,
          title: LH_PLUGIN_GROUP_PERFORMANCE.title,
          plugin: { slug: LH_PLUGIN_META.slug, title: LH_PLUGIN_META.title },
          score: 0.92,
        },
      ],
      added: [],
      removed: [],
    },
    audits: {
      changed: [],
      unchanged: [
        ...ESLINT_AUDIT_SLUGS.map(
          (slug): AuditResult => ({
            slug,
            title: ESLINT_AUDITS_MAP[slug].title,
            docsUrl: ESLINT_AUDITS_MAP[slug].docsUrl,
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
              docsUrl: ESLINT_PLUGIN_META.docsUrl,
            },
            score: ESLINT_AUDITS_MAP[slug].score,
            value: ESLINT_AUDITS_MAP[slug].value,
            displayValue: ESLINT_AUDITS_MAP[slug].displayValue,
          }),
        ),
        ...LIGHTHOUSE_AUDIT_SLUGS.map(
          (slug): AuditResult => ({
            slug,
            title: LIGHTHOUSE_AUDITS_MAP[slug].title,
            docsUrl: LIGHTHOUSE_AUDITS_MAP[slug].docsUrl,
            plugin: { slug: LH_PLUGIN_META.slug, title: LH_PLUGIN_META.title },
            score: LIGHTHOUSE_AUDITS_MAP[slug].score,
            value: LIGHTHOUSE_AUDITS_MAP[slug].value,
            displayValue: LIGHTHOUSE_AUDITS_MAP[slug].displayValue,
          }),
        ),
      ],
      added: [],
      removed: [],
    },
  };
}

export function reportsDiffChangedMock(): ReportsDiff {
  const originalDiff = reportsDiffUnchangedMock();
  return {
    ...originalDiff,
    audits: {
      ...originalDiff.audits,
      changed: [
        {
          slug: 'no-unused-vars' satisfies ESLintAuditSlug,
          title: ESLINT_AUDITS_MAP['no-unused-vars'].title,
          docsUrl: ESLINT_AUDITS_MAP['no-unused-vars'].docsUrl,
          plugin: {
            slug: ESLINT_PLUGIN_META.slug,
            title: ESLINT_PLUGIN_META.title,
            docsUrl: ESLINT_PLUGIN_META.docsUrl,
          },
          scores: { before: 0, after: 0, diff: 0 },
          values: { before: 12, after: 10, diff: -2 },
          displayValues: { before: '12 warnings', after: '10 warnings' },
        },
      ],
    },
  };
}

export function reportsDiffAddedPluginMock(): ReportsDiff {
  const originalDiff = reportsDiffAltMock();
  return {
    ...originalDiff,
    categories: {
      ...originalDiff.categories,
      changed: originalDiff.categories.changed.filter(
        ({ slug }) => slug !== ('performance' satisfies CategorySlug),
      ),
      added: [
        {
          slug: 'performance' satisfies CategorySlug,
          title: CATEGORIES_MAP['performance'].title,
          score: categoryScores('performance').after,
        },
      ],
    },
    groups: {
      ...originalDiff.groups,
      changed: originalDiff.groups.changed.filter(
        ({ plugin }) => plugin.slug !== 'lighthouse',
      ),
      added: originalDiff.groups.changed
        .filter(({ plugin }) => plugin.slug === 'lighthouse')
        .map(group => ({
          slug: group.slug,
          title: group.title,
          plugin: group.plugin,
          score: group.scores.after,
        })),
    },
    audits: {
      ...originalDiff.audits,
      changed: originalDiff.audits.changed.filter(
        ({ plugin }) => plugin.slug !== 'lighthouse',
      ),
      added: originalDiff.audits.changed
        .filter(({ plugin }) => plugin.slug === 'lighthouse')
        .map(audit => ({
          slug: audit.slug,
          title: audit.title,
          docsUrl: audit.docsUrl,
          plugin: audit.plugin,
          score: audit.scores.after,
          value: audit.values.after,
          displayValue: audit.displayValues.after,
        })),
    },
  };
}

function categoryScores(slug: CategorySlug): CategoryDiff['scores'] {
  switch (slug) {
    case 'performance':
      return { before: 0.92, after: 0.94, diff: 0.02 };
    case 'bug-prevention':
      return { before: 0.68, after: 0.95, diff: 0.27 };
    case 'code-style':
      return { before: 0.54, after: 1, diff: 0.46 };
  }
}

function toNumberComparison({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  return { before, after, diff: after - before };
}
