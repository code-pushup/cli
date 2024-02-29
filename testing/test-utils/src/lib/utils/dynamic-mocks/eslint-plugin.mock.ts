import { join } from 'node:path';
import type {
  Audit,
  CategoryRef,
  Group,
  PluginConfig,
  PluginReport,
} from '@code-pushup/models';
import { ESLINT_AUDITS_MAP } from './eslint-audits.mock';
import { echoRunnerConfigMock } from './runner-config.mock';

const ESLINT_PLUGIN_GROUP_MAX_LINES: Group = {
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

const eslintMeta = {
  slug: 'eslint',
  title: 'ESLint',
  icon: 'eslint',
  description: 'Official Code PushUp ESLint plugin',
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
      } satisfies Audit),
  );
  return {
    ...eslintMeta,
    runner: echoRunnerConfigMock(
      Object.values(ESLINT_AUDITS_MAP),
      join(outputDir, 'eslint-out.json'),
    ),
    audits,
  };
}

export function eslintPluginReportMock(): PluginReport {
  return {
    ...eslintMeta,
    date: '2023-10-18T07:49:45.531Z',
    duration: 368,
    audits: Object.values(ESLINT_AUDITS_MAP),
    groups: [ESLINT_PLUGIN_GROUP_MAX_LINES],
  };
}

type ESLintAuditSlug = keyof typeof ESLINT_AUDITS_MAP;

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
