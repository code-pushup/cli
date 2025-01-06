export default {
  extends: 'stylelint-config-standard',
  rules: {
    // Style Rules - Warnings

    // Formatting
    'indentation': [2, { severity: 'warning' }], // Enforce consistent indentation
    'max-line-length': [80, { severity: 'warning' }], // Limit line length
    'max-empty-lines': [1, { severity: 'warning' }], // Limit empty lines
    'no-eol-whitespace': [true, { severity: 'warning' }], // No end-of-line whitespace
    'declaration-block-no-redundant-longhand-properties': [true, { severity: 'warning' }], // Combine longhand properties

    // Spacing
    'declaration-block-semicolon-space-after': ['always', { severity: 'warning' }], // Space after semicolons
    'declaration-block-semicolon-space-before': ['never', { severity: 'warning' }], // No space before semicolons
    'block-closing-brace-space-before': ['always-single-line', { severity: 'warning' }], // Space before closing braces

    // Quotes and Strings
    'string-quotes': ['double', { severity: 'warning' }], // Enforce double quotes
    'font-family-name-quotes': ['always-where-recommended', { severity: 'warning' }], // Font family quotes
    'function-url-quotes': ['always', { severity: 'warning' }], // Quotes around URLs

    // Colors
    'color-hex-case': ['lower', { severity: 'warning' }], // Lowercase hex codes
    'color-hex-length': ['short', { severity: 'warning' }], // Short hex codes
    'color-function-notation': ['modern', { severity: 'warning' }], // Modern color functions
    'lightness-notation': ['percentage', { severity: 'warning' }], // Percentage lightness

    // Lists
    'value-list-comma-space-after': ['always-single-line', { severity: 'warning' }], // Space after commas in lists
    'selector-list-comma-newline-after': ['always', { severity: 'warning' }], // Newline after selector commas

    // Miscellaneous
    'comment-whitespace-inside': ['always', { severity: 'warning' }], // Space inside comments
    'keyframes-name-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      { severity: 'warning', message: 'Keyframe names must be kebab-case.' },
    ], // Keyframe names must be kebab-case
    'alpha-value-notation': ['percentage', { severity: 'warning' }], // Use percentages for alpha values

    // Bug Prevention Rules - Errors

    'annotation-no-unknown': true, // Prevent unknown annotations
    'at-rule-no-unknown': true, // Disallow unknown at-rules
    'block-no-empty': true, // Disallow empty blocks
    'color-no-invalid-hex': true, // Disallow invalid hex colors
    'custom-property-no-missing-var-function': true, // Disallow missing var functions
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ], // Prevent duplicate properties
    'function-no-unknown': true, // Disallow unknown functions
    'keyframe-block-no-duplicate-selectors': true, // Prevent duplicate keyframe selectors
    'media-feature-name-no-unknown': true, // Disallow unknown media features
    'no-duplicate-selectors': true, // Disallow duplicate selectors
    'property-no-unknown': true, // Disallow unknown properties
    'selector-pseudo-class-no-unknown': true, // Disallow unknown pseudo-classes
    'unit-no-unknown': true, // Disallow unknown units
  },
};
