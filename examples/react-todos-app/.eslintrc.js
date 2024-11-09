/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['react', 'react-hooks'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // https://eslint.org/docs/latest/rules/#possible-problems
    'no-cond-assign': 'warn',
    'no-const-assign': 'warn',
    'no-debugger': 'warn',
    'no-invalid-regexp': 'warn',
    'no-undef': 'warn',
    'no-unreachable-loop': 'warn',
    'no-unsafe-negation': 'warn',
    'no-unsafe-optional-chaining': 'warn',
    'no-unused-vars': 'warn',
    'use-isnan': 'warn',
    'valid-typeof': 'warn',
    // https://eslint.org/docs/latest/rules/#suggestions
    'arrow-body-style': 'warn',
    camelcase: 'warn',
    curly: 'warn',
    eqeqeq: 'warn',
    'max-lines-per-function': 'warn',
    'max-lines': 'warn',
    'no-shadow': 'warn',
    'no-var': 'warn',
    'object-shorthand': 'warn',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
    'prefer-object-spread': 'warn',
    yoda: 'warn',
    // https://github.com/jsx-eslint/eslint-plugin-react#list-of-supported-rules
    'react/jsx-key': 'warn',
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/jsx-uses-react': 'error',
    // https://www.npmjs.com/package/eslint-plugin-react-hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
