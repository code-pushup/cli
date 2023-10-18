import type { CategoryConfig, PluginReport } from '../../src';
import { ESLINT_AUDITS_MAP } from './eslint-audits.mock';

export function eslintPluginReport(): PluginReport {
  return {
    slug: 'eslint',
    title: 'ESLint',
    icon: 'eslint',
    description: 'Official Code PushUp ESLint plugin',
    packageName: '@code-pushup/eslint-plugin',
    version: '0.1.0',
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
