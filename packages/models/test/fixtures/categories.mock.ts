import type { CategoryConfig } from '../../src';
import { eslintAuditRef } from './eslint-plugin.mock';

const CATEGORIES_MAP = {
  performance: {
    slug: 'performance',
    title: 'Performance',
    refs: [
      {
        type: 'group',
        plugin: 'lighthouse',
        slug: 'performance',
        weight: 1,
      },
      eslintAuditRef('react-jsx-key', 0),
    ],
  },
  'bug-prevention': {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    refs: [
      eslintAuditRef('no-cond-assign'),
      eslintAuditRef('no-const-assign'),
      eslintAuditRef('no-debugger'),
      eslintAuditRef('no-invalid-regexp'),
      eslintAuditRef('no-undef'),
      eslintAuditRef('no-unreachable-loop'),
      eslintAuditRef('no-unsafe-negation'),
      eslintAuditRef('no-unsafe-optional-chaining'),
      eslintAuditRef('use-isnan'),
      eslintAuditRef('valid-typeof'),
      eslintAuditRef('eqeqeq'),
      eslintAuditRef('react-jsx-key', 2),
      eslintAuditRef('react-prop-types'),
      eslintAuditRef('react-react-in-jsx-scope'),
      eslintAuditRef('react-hooks-rules-of-hooks', 2),
      eslintAuditRef('react-hooks-exhaustive-deps', 2),
    ],
  },
  'code-style': {
    slug: 'code-style',
    title: 'Code style',
    refs: [
      eslintAuditRef('no-unused-vars'),
      eslintAuditRef('arrow-body-style'),
      eslintAuditRef('camelcase'),
      eslintAuditRef('curly'),
      eslintAuditRef('eqeqeq'),
      eslintAuditRef('max-lines-per-function'),
      eslintAuditRef('max-lines'),
      eslintAuditRef('object-shorthand'),
      eslintAuditRef('prefer-arrow-callback'),
      eslintAuditRef('prefer-const'),
      eslintAuditRef('prefer-object-spread'),
      eslintAuditRef('yoda'),
      eslintAuditRef('no-var'),
    ],
  },
} satisfies Record<string, CategoryConfig>;

type CategorySlug = keyof typeof CATEGORIES_MAP;

export function categoryConfig(
  slug: CategorySlug = 'performance',
): CategoryConfig {
  return CATEGORIES_MAP[slug];
}

export function categoryConfigs(): CategoryConfig[] {
  return Object.values(CATEGORIES_MAP);
}
