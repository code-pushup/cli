import type {
  AuditDiff,
  AuditResult,
  CategoryDiff,
  ReportsDiff,
} from '@code-pushup/models';
import { COMMIT_ALT_MOCK, COMMIT_MOCK } from '../commit.mock';
import {
  CATEGORIES_MAP,
  CATEGORY_SLUGS,
  type CategorySlug,
} from './categories.mock';
import {
  ESLINT_AUDITS_FIXED_SLUGS,
  ESLINT_AUDITS_MAP,
  ESLINT_AUDIT_SLUGS,
} from './eslint-audits.mock';
import {
  ESLINT_PLUGIN_GROUP_MAX_LINES,
  ESLINT_PLUGIN_META,
} from './eslint-plugin.mock';
import {
  LIGHTHOUSE_AUDITS_CHANGES,
  LIGHTHOUSE_AUDITS_MAP,
  LIGHTHOUSE_AUDIT_SLUGS,
} from './lighthouse-audits.mock';
import {
  LH_PLUGIN_GROUP_PERFORMANCE,
  LH_PLUGIN_META,
} from './lighthouse-plugin.mock';

export function reportsDiffMock(): ReportsDiff {
  return {
    commits: {
      before: COMMIT_MOCK,
      after: COMMIT_ALT_MOCK,
    },
    categories: {
      changed: CATEGORY_SLUGS.map(slug => ({
        slug,
        title: CATEGORIES_MAP[slug].title,
        scores: categoryScores(slug),
      })),
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
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
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
            plugin: {
              slug: ESLINT_PLUGIN_META.slug,
              title: ESLINT_PLUGIN_META.title,
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
