import { join } from 'node:path';
import type {
  Audit,
  CategoryRef,
  PluginConfig,
  PluginReport,
} from '@code-pushup/models';
import { ESLINT_AUDITS_MAP } from './eslint-audits.mock';
import { echoRunnerConfigMock } from './runner-config.mock';

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
