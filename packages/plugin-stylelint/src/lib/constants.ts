import type { CategoryConfig, Group } from '@code-pushup/models';
import type { GroupSlug } from './types.js';

export const STYLELINT_PLUGIN_SLUG = 'stylelint' as const;
export const DEFAULT_STYLELINTRC = '.stylelintrc.json' as const;

const AUDIT_TO_GROUP_MAP = {
  // Avoid errors

  descending: ['no-descending-specificity'],

  duplicate: [
    'declaration-block-no-duplicate-custom-properties',
    'declaration-block-no-duplicate-properties',
    'font-family-no-duplicate-names',
    'keyframe-block-no-duplicate-selectors',
    'no-duplicate-at-import-rules',
    'no-duplicate-selectors',
  ],

  empty: ['block-no-empty', 'comment-no-empty', 'no-empty-source'],

  invalid: [
    'color-no-invalid-hex',
    'function-calc-no-unspaced-operator',
    'keyframe-declaration-no-important',
    'media-query-no-invalid',
    'named-grid-areas-no-invalid',
    'no-invalid-double-slash-comments',
    'no-invalid-position-at-import-rule',
    'string-no-newline',
  ],

  irregular: ['no-irregular-whitespace'],

  missing: [
    'custom-property-no-missing-var-function',
    'font-family-no-missing-generic-family-keyword',
  ],

  'non-standard': ['function-linear-gradient-no-nonstandard-direction'],

  overrides: ['declaration-block-no-shorthand-property-overrides'],

  unmatchable: ['selector-anb-no-unmatchable'],

  unknown: [
    'annotation-no-unknown',
    'at-rule-no-unknown',
    'function-no-unknown',
    'media-feature-name-no-unknown',
    'property-no-unknown',
    'selector-pseudo-class-no-unknown',
    'selector-type-no-unknown',
    'unit-no-unknown',
  ],

  // Enforce conventions

  'allowed-disallowed-required': [
    'at-rule-no-vendor-prefix',
    'length-zero-no-unit',
    'media-feature-name-no-vendor-prefix',
    'property-no-vendor-prefix',
    'value-no-vendor-prefix',
  ],

  case: ['function-name-case', 'selector-type-case', 'value-keyword-case'],

  'empty-lines': [
    'at-rule-empty-line-before',
    'comment-empty-line-before',
    'custom-property-empty-line-before',
    'declaration-empty-line-before',
    'rule-empty-line-before',
  ],

  'max-min': [
    'declaration-block-single-line-max-declarations',
    'number-max-precision',
  ],

  notation: [
    'alpha-value-notation',
    'color-function-notation',
    'color-hex-length',
    'hue-degree-notation',
    'import-notation',
    'keyframe-selector-notation',
    'lightness-notation',
    'media-feature-range-notation',
    'selector-not-notation',
    'selector-pseudo-element-colon-notation',
  ],

  pattern: [
    'custom-media-pattern',
    'custom-property-pattern',
    'keyframes-name-pattern',
    'selector-class-pattern',
    'selector-id-pattern',
  ],

  quotes: [
    'font-family-name-quotes',
    'function-url-quotes',
    'selector-attribute-quotes',
  ],

  redundant: [
    'declaration-block-no-redundant-longhand-properties',
    'shorthand-property-no-redundant-values',
  ],

  'whitespace-inside': ['comment-whitespace-inside'],
};

export const GROUPS = [
  {
    slug: 'problems' as const,
    title: 'Problems',
    refs: [],
  },
  {
    slug: 'suggestions' as const,
    title: 'Suggestions',
    refs: [],
  },
] satisfies Group[];

export const CATEGORY_MAP: Record<string, CategoryConfig> = {
  'code-style': {
    slug: 'code-style' as const,
    title: 'Code Style',
    refs: [
      {
        slug: 'suggestions' as GroupSlug,
        weight: 1,
        type: 'group',
        plugin: 'stylelint',
      },
    ],
  },
  'bug-prevention': {
    slug: 'bug-prevention' as const,
    title: 'Bug Prevention',
    refs: [
      {
        slug: 'problems' as GroupSlug,
        weight: 1,
        type: 'group',
        plugin: 'stylelint',
      },
    ],
  },
};
