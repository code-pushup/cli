import coveragePlugin from '@code-pushup/coverage-plugin';
import eslintPlugin from '@code-pushup/eslint-plugin';

const eslintAuditRef = (slug, weight) => ({
  type: 'audit',
  plugin: 'eslint',
  slug,
  weight,
});

export default {
  persist: {
    outputDir: '../../tmp/e2e/react-todos-app',
  },
  plugins: [
    await coveragePlugin({
      reports: ['../../coverage/react-todos-app/lcov.info'],
      coverageToolCommand: {
        command: 'npx',
        args: ['vitest', 'run', '--coverage'],
      },
    }),
    await eslintPlugin({
      eslintrc: '.eslintrc.json',
      patterns: ['src/**/*.js', 'src/**/*.jsx'],
    }),
  ],
  categories: [
    {
      slug: 'code-coverage',
      title: 'Code coverage',
      refs: [
        {
          type: 'group',
          plugin: 'coverage',
          slug: 'coverage',
          weight: 1,
        },
      ],
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        eslintAuditRef('no-cond-assign', 1),
        eslintAuditRef('no-const-assign', 1),
        eslintAuditRef('no-debugger', 1),
        eslintAuditRef('no-invalid-regexp', 1),
        eslintAuditRef('no-undef', 1),
        eslintAuditRef('no-unreachable-loop', 1),
        eslintAuditRef('no-unsafe-negation', 1),
        eslintAuditRef('no-unsafe-optional-chaining', 1),
        eslintAuditRef('use-isnan', 1),
        eslintAuditRef('valid-typeof', 1),
        eslintAuditRef('eqeqeq', 1),
        eslintAuditRef('react-jsx-key', 2),
        eslintAuditRef('react-prop-types', 1),
        eslintAuditRef('react-react-in-jsx-scope', 1),
        eslintAuditRef('react-hooks-rules-of-hooks', 2),
        eslintAuditRef('react-hooks-exhaustive-deps', 2),
      ],
    },

    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        eslintAuditRef('no-unused-vars', 1),
        eslintAuditRef('arrow-body-style', 1),
        eslintAuditRef('camelcase', 1),
        eslintAuditRef('curly', 1),
        eslintAuditRef('eqeqeq', 1),
        eslintAuditRef('max-lines-per-function', 1),
        eslintAuditRef('max-lines', 1),
        eslintAuditRef('object-shorthand', 1),
        eslintAuditRef('prefer-arrow-callback', 1),
        eslintAuditRef('prefer-const', 1),
        eslintAuditRef('prefer-object-spread', 1),
        eslintAuditRef('yoda', 1),
        eslintAuditRef('no-var', 1),
      ],
    },
  ],
};
