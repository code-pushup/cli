import type { CategoryConfig } from '@code-pushup/models';
import { eslintAuditRefMock } from './eslint-plugin.mock.js';

export const CATEGORIES_MAP = {
  performance: {
    slug: 'performance',
    title: 'Performance',
    description: 'Performance metrics',
    docsUrl: 'https://developers.google.com/web/fundamentals/performance',
    refs: [
      {
        type: 'group',
        plugin: 'eslint',
        slug: 'max-line-limitation',
        weight: 0,
      },
      {
        type: 'group',
        plugin: 'lighthouse',
        slug: 'performance',
        weight: 1,
      },
      eslintAuditRefMock('react-jsx-key', 0),
    ],
  },
  'bug-prevention': {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    refs: [
      eslintAuditRefMock('no-cond-assign'),
      eslintAuditRefMock('no-const-assign'),
      eslintAuditRefMock('no-debugger'),
      eslintAuditRefMock('no-invalid-regexp'),
      eslintAuditRefMock('no-undef'),
      eslintAuditRefMock('no-unreachable-loop'),
      eslintAuditRefMock('no-unsafe-negation'),
      eslintAuditRefMock('no-unsafe-optional-chaining'),
      eslintAuditRefMock('use-isnan'),
      eslintAuditRefMock('valid-typeof'),
      eslintAuditRefMock('eqeqeq'),
      eslintAuditRefMock('react-jsx-key', 2),
      eslintAuditRefMock('react-prop-types'),
      eslintAuditRefMock('react-react-in-jsx-scope'),
      eslintAuditRefMock('react-hooks-rules-of-hooks', 2),
      eslintAuditRefMock('react-hooks-exhaustive-deps', 2),
    ],
  },
  'code-style': {
    slug: 'code-style',
    title: 'Code style',
    refs: [
      eslintAuditRefMock('no-unused-vars'),
      eslintAuditRefMock('arrow-body-style'),
      eslintAuditRefMock('camelcase'),
      eslintAuditRefMock('curly'),
      eslintAuditRefMock('eqeqeq'),
      eslintAuditRefMock('max-lines-per-function'),
      eslintAuditRefMock('max-lines'),
      eslintAuditRefMock('object-shorthand'),
      eslintAuditRefMock('prefer-arrow-callback'),
      eslintAuditRefMock('prefer-const'),
      eslintAuditRefMock('prefer-object-spread'),
      eslintAuditRefMock('yoda'),
      eslintAuditRefMock('no-var'),
    ],
  },
} satisfies Record<string, CategoryConfig>;

export type CategorySlug = keyof typeof CATEGORIES_MAP;

export const CATEGORY_SLUGS = Object.keys(CATEGORIES_MAP) as CategorySlug[];

export function categoryConfigMock(
  slug: CategorySlug = 'performance',
): CategoryConfig {
  return CATEGORIES_MAP[slug];
}

export function categoryConfigsMock(): CategoryConfig[] {
  return Object.values(JSON.parse(JSON.stringify(CATEGORIES_MAP)));
}
