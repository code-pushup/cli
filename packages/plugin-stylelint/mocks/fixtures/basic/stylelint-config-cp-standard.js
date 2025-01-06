/**
 * Standard Stylelint configuration that extends the stylelint-config-standard.
 * "Avoid errors" rules are set to "error" severity.
 * "Enforce conventions" rules are set to "warning" severity.
 */

const stylelintConfig = {
  extends: ['stylelint-config-standard'],
  rules: {
    // = Avoid errors - set as errors

    // == Descending
    'no-descending-specificity': [true, { severity: 'error' }],

    // == Duplicate
    'declaration-block-no-duplicate-custom-properties': [true, { severity: 'error' }],
    'declaration-block-no-duplicate-properties': [
      true,
      { severity: 'error', ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ],
    'font-family-no-duplicate-names': [true, { severity: 'error' }],
    'keyframe-block-no-duplicate-selectors': [true, { severity: 'error' }],
    'no-duplicate-at-import-rules': [true, { severity: 'error' }],
    'no-duplicate-selectors': [true, { severity: 'error' }],

    // == Empty
    'block-no-empty': [true, { severity: 'error' }],
    'comment-no-empty': [true, { severity: 'error' }],
    'no-empty-source': [true, { severity: 'error' }],

    // == Invalid
    'color-no-invalid-hex': [true, { severity: 'error' }],
    'function-calc-no-unspaced-operator': [true, { severity: 'error' }],
    'keyframe-declaration-no-important': [true, { severity: 'error' }],
    'media-query-no-invalid': [true, { severity: 'error' }],
    'named-grid-areas-no-invalid': [true, { severity: 'error' }],
    'no-invalid-double-slash-comments': [true, { severity: 'error' }],
    'no-invalid-position-at-import-rule': [true, { severity: 'error' }],
    'string-no-newline': [true, { severity: 'error' }],

    // == Irregular
    'no-irregular-whitespace': [true, { severity: 'error' }],

    // == Missing
    'custom-property-no-missing-var-function': [true, { severity: 'error' }],
    'font-family-no-missing-generic-family-keyword': [true, { severity: 'error' }],

    // == Non-standard
    'function-linear-gradient-no-nonstandard-direction': [true, { severity: 'error' }],

    // == Overrides
    'declaration-block-no-shorthand-property-overrides': [true, { severity: 'error' }],

    // == Unmatchable
    'selector-anb-no-unmatchable': [true, { severity: 'error' }],

    // == Unknown
    'annotation-no-unknown': [true, { severity: 'error' }],
    'at-rule-no-unknown': [true, { severity: 'error' }],
    'function-no-unknown': [true, { severity: 'error' }],
    'media-feature-name-no-unknown': [true, { severity: 'error' }],
    'property-no-unknown': [true, { severity: 'error' }],
    'selector-pseudo-class-no-unknown': [true, { severity: 'error' }],
    'selector-type-no-unknown': [true, { severity: 'error' }],
    'unit-no-unknown': [true, { severity: 'error' }],

    // == Maintainability Rules

    // Prevent overly specific selectors
    // Example: Good: `.class1 .class2`, Bad: `#id.class1 .class2`
    "selector-max-specificity": ["0,2,0", { severity: "warning" }],
    // Enforces a maximum specificity of 2 classes, no IDs, and no inline styles.
    // Encourages maintainable selectors.

    // Disallow the use of ID selectors
    // Example: Good: `.button`, Bad: `#button`
    "selector-max-id": [0, { severity: "warning" }],
    // Prevents the use of IDs in selectors, as they are too specific and hard to override.

    // Limit the number of class selectors in a rule
    // Example: Good: `.btn.primary`, Bad: `.btn.primary.large.rounded`
    "selector-max-class": [3, { severity: "off" }],
    // Can help avoid overly complex class chains, but may be unnecessary if specificity is already managed.

    // Limit the number of pseudo-classes in a selector
    // Example: Good: `.list-item:hover`, Bad: `.list-item:nth-child(2):hover:active`
    "selector-max-pseudo-class": [3, { severity: "warning" }],
    // Allows up to 3 pseudo-classes in a single selector to balance flexibility and simplicity.

    // Restrict the number of type selectors (e.g., `div`, `span`)
    // Example: Good: `.header`, Bad: `div.header`
    "selector-max-type": [1, { severity: "warning" }],
    // Promotes the use of semantic classes over type selectors for better reusability and maintainability.

    // Optional: Additional rules for project-specific preferences
    // Uncomment the following if relevant to your project:
    /*
    // Example: Limit the depth of combinators
    // Good: `.parent > .child`, Bad: `.parent > .child > .grandchild`
    "selector-max-combinators": [2, { severity: "warning" }],

    // Example: Restrict the number of universal selectors in a rule
    // Good: `* { margin: 0; }`, Bad: `.wrapper * .content { padding: 0; }`
    "selector-max-universal": [1, { severity: "warning" }],
    */

    // = Enforce conventions - set as warnings

    // == Allowed, disallowed & required
    'at-rule-no-vendor-prefix': [true, { severity: 'warning' }],
    'length-zero-no-unit': [true, { severity: 'warning' }],
    'media-feature-name-no-vendor-prefix': [true, { severity: 'warning' }],
    'property-no-vendor-prefix': [true, { severity: 'warning' }],
    'value-no-vendor-prefix': [true, { severity: 'warning' }],

    // == Case
    'function-name-case': ['lower', { severity: 'warning' }],
    'selector-type-case': ['lower', { severity: 'warning' }],
    'value-keyword-case': ['lower', { severity: 'warning' }],

    // == Empty lines
    'at-rule-empty-line-before': ['always', { severity: 'warning' }],
    'comment-empty-line-before': ['always', { severity: 'warning' }],
    'custom-property-empty-line-before': ['always', { severity: 'warning' }],
    'declaration-empty-line-before': ['always', { severity: 'warning' }],
    'rule-empty-line-before': ['always', { severity: 'warning' }],

    // == Max & min
    'declaration-block-single-line-max-declarations': [1, { severity: 'warning' }],
    'number-max-precision': [4, { severity: 'warning' }],

    // == Notation
    'alpha-value-notation': ['percentage', { severity: 'warning' }],
    'color-function-notation': ['modern', { severity: 'warning' }],
    'color-hex-length': ['short', { severity: 'warning' }],
    'hue-degree-notation': ['angle', { severity: 'warning' }],
    'import-notation': ['string', { severity: 'warning' }],
    'keyframe-selector-notation': ['percentage', { severity: 'warning' }],
    'lightness-notation': ['percentage', { severity: 'warning' }],
    'media-feature-range-notation': ['context', { severity: 'warning' }],
    'selector-not-notation': ['complex', { severity: 'warning' }],
    'selector-pseudo-element-colon-notation': ['double', { severity: 'warning' }],

    // == Pattern
    'custom-media-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', { severity: 'warning' }],
    'custom-property-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', { severity: 'warning' }],
    'keyframes-name-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', { severity: 'warning' }],
    'selector-class-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', { severity: 'warning' }],
    'selector-id-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$', { severity: 'warning' }],

    // == Quotes
    'font-family-name-quotes': ['always-where-recommended', { severity: 'warning' }],
    'function-url-quotes': ['always', { severity: 'warning' }],
    'selector-attribute-quotes': ['always', { severity: 'warning' }],

    // == Redundant
    'declaration-block-no-redundant-longhand-properties': [true, { severity: 'warning' }],
    'shorthand-property-no-redundant-values': [true, { severity: 'warning' }],

    // == Whitespace inside
    'comment-whitespace-inside': ['always', { severity: 'warning' }],
  },
};

export default stylelintConfig;
