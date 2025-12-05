import path from 'node:path';
import type {
  Audit,
  AuditReport,
  CategoryRef,
  Group,
  PluginConfig,
  PluginReport,
} from '@code-pushup/models';
import {
  ESLINT_AUDITS_FIXED_SLUGS,
  ESLINT_AUDITS_MAP,
  ESLINT_AUDIT_SLUGS,
} from './eslint-audits.mock.js';
import { echoRunnerConfigMock } from './runner-config.mock.js';

export const ESLINT_PLUGIN_GROUP_MAX_LINES: Group = {
  slug: 'max-line-limitation',
  title: 'Maximum lines limitation',
  refs: [
    {
      slug: ESLINT_AUDITS_MAP['max-lines-per-function'].slug,
      weight: 1,
    },
    {
      slug: ESLINT_AUDITS_MAP['max-lines'].slug,
      weight: 1,
    },
  ],
};

export const ESLINT_PLUGIN_META = {
  slug: 'eslint',
  title: 'ESLint',
  icon: 'eslint',
  description: 'Official Code PushUp ESLint plugin',
  docsUrl: 'https://www.npmjs.com/package/@code-pushup/eslint-plugin',
  packageName: '@code-pushup/eslint-plugin',
  version: '0.1.0',
} satisfies Partial<PluginConfig>;

export function eslintPluginConfigMock(outputDir = 'tmp'): PluginConfig {
  const audits = Object.values(ESLINT_AUDITS_MAP).map(
    ({ slug, description, title, docsUrl }) =>
      ({
        slug,
        description,
        title,
        docsUrl,
      }) satisfies Audit,
  );
  return {
    ...ESLINT_PLUGIN_META,
    runner: echoRunnerConfigMock(
      Object.values(ESLINT_AUDITS_MAP),
      path.join(outputDir, 'eslint-out.json'),
    ),
    audits,
  };
}

export function eslintPluginReportMock(): PluginReport {
  return {
    ...ESLINT_PLUGIN_META,
    date: '2023-10-18T07:49:45.531Z',
    duration: 368,
    audits: Object.values(ESLINT_AUDITS_MAP),
    groups: [ESLINT_PLUGIN_GROUP_MAX_LINES],
  };
}
export function eslintPluginReportAltMock(): PluginReport {
  return {
    ...eslintPluginReportMock(),
    date: '2024-03-12T12:42:05.388Z',
    duration: 316,
    audits: ESLINT_AUDIT_SLUGS.map(
      (slug): AuditReport =>
        ESLINT_AUDITS_FIXED_SLUGS.includes(slug)
          ? {
              ...ESLINT_AUDITS_MAP[slug],
              score: 1,
              value: 0,
              displayValue: 'passed',
              details: { issues: [] },
            }
          : ESLINT_AUDITS_MAP[slug],
    ),
  };
}

export type ESLintAuditSlug = keyof typeof ESLINT_AUDITS_MAP;

export function eslintAuditRefMock(
  slug: ESLintAuditSlug,
  weight = 1,
): CategoryRef {
  return {
    type: 'audit',
    plugin: 'eslint',
    slug,
    weight,
  };
}
