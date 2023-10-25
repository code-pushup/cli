import type {
  Audit,
  CategoryConfig,
  PluginConfig,
  PluginReport,
} from '../../src';
import { ESLINT_AUDITS_MAP } from './eslint-audits.mock';
import { runnerConfig } from './runner.mock';

const eslintMeta = {
  slug: 'eslint',
  title: 'ESLint',
  icon: 'eslint',
  description: 'Official Code PushUp ESLint plugin',
  packageName: '@code-pushup/eslint-plugin',
  version: '0.1.0',
} satisfies Partial<PluginConfig>;

export function eslintPluginConfig(outputDir = 'tmp'): PluginConfig {
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
    runner: runnerConfig(
      Object.values(ESLINT_AUDITS_MAP),
      join(outputDir, 'eslint-out.json'),
    ),
    audits,
  };
}

export function eslintPluginReport(): PluginReport {
  return {
    ...eslintMeta,
    date: '2023-10-18T07:49:45.531Z',
    duration: 368,
    audits: Object.values(ESLINT_AUDITS_MAP),
  };
}

type ESLintAuditSlug = keyof typeof ESLINT_AUDITS_MAP;

export function eslintAuditRef(
  slug: ESLintAuditSlug,
  weight = 1,
): CategoryConfig['refs'][number] {
  return {
    type: 'audit',
    plugin: 'eslint',
    slug,
    weight,
  };
}
