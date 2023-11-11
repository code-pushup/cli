import type { CategoryConfig } from '../../src';
import { eslintAuditRef } from './eslint-plugin.mock';

const CATEGORIES_MAP = {
  performance: {
    slug: 'performance',
    title: 'Performance',
    description: 'Performance metrics',
    docsUrl: 'https://developers.google.com/web/fundamentals/performance',
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

export function categoryConfig(slug = 'category-slug-1'): CategoryConfig {
  return {
    slug,
    title: 'Category Title',
    description: 'Category description here',
    docsUrl: 'https://info.dev?category=category-slug',
    refs: [
      {
        type: 'audit',
        plugin: 'plugin-1',
        slug: 'audit-1',
        weight: 1,
      },
    ],
  };
}

export function categoryConfigs(): CategoryConfig[] {
  return Object.values(JSON.parse(JSON.stringify(CATEGORIES_MAP)));
}
