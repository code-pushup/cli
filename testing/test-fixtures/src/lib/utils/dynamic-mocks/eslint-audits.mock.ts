import type { AuditReport } from '@code-pushup/models';

export const ESLINT_AUDITS_FIXED_SLUGS: (keyof typeof ESLINT_AUDITS_MAP)[] = [
  'no-unused-vars',
  'arrow-body-style',
  'eqeqeq',
  'max-lines-per-function',
  'no-shadow',
  'object-shorthand',
  'prefer-const',
  'react-jsx-key',
  'react-hooks-exhaustive-deps',
];

export const ESLINT_AUDITS_MAP = {
  'no-cond-assign': {
    slug: 'no-cond-assign',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow assignment operators in conditional expressions',
    description: 'ESLint rule **no-cond-assign**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-cond-assign',
  },
  'no-const-assign': {
    slug: 'no-const-assign',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow reassigning `const` variables',
    description: 'ESLint rule **no-const-assign**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-const-assign',
  },
  'no-debugger': {
    slug: 'no-debugger',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow the use of `debugger`',
    description: 'ESLint rule **no-debugger**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-debugger',
  },
  'no-invalid-regexp': {
    slug: 'no-invalid-regexp',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title:
      'Disallow invalid regular expression strings in `RegExp` constructors',
    description: 'ESLint rule **no-invalid-regexp**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-invalid-regexp',
  },
  'no-undef': {
    slug: 'no-undef',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title:
      'Disallow the use of undeclared variables unless mentioned in `/*global */` comments',
    description: 'ESLint rule **no-undef**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-undef',
  },
  'no-unreachable-loop': {
    slug: 'no-unreachable-loop',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow loops with a body that allows only one iteration',
    description: 'ESLint rule **no-unreachable-loop**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-unreachable-loop',
  },
  'no-unsafe-negation': {
    slug: 'no-unsafe-negation',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow negating the left operand of relational operators',
    description: 'ESLint rule **no-unsafe-negation**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-unsafe-negation',
  },
  'no-unsafe-optional-chaining': {
    slug: 'no-unsafe-optional-chaining',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title:
      'Disallow use of optional chaining in contexts where the `undefined` value is not allowed',
    description: 'ESLint rule **no-unsafe-optional-chaining**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining',
  },
  'no-unused-vars': {
    slug: 'no-unused-vars',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message: "'loading' is assigned a value but never used.",
          severity: 'warning',
          source: {
            file: 'src/App.jsx',
            position: {
              startLine: 8,
              startColumn: 11,
              endLine: 8,
              endColumn: 18,
            },
          },
        },
      ],
    },
    title: 'Disallow unused variables',
    description: 'ESLint rule **no-unused-vars**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-unused-vars',
  },
  'use-isnan': {
    slug: 'use-isnan',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Require calls to `isNaN()` when checking for `NaN`',
    description: 'ESLint rule **use-isnan**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/use-isnan',
  },
  'valid-typeof': {
    slug: 'valid-typeof',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Enforce comparing `typeof` expressions against valid strings',
    description: 'ESLint rule **valid-typeof**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/valid-typeof',
  },
  'arrow-body-style': {
    slug: 'arrow-body-style',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message:
            'Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`.',
          severity: 'warning',
          source: {
            file: 'src/components/TodoFilter.jsx',
            position: {
              startLine: 3,
              startColumn: 29,
              endLine: 25,
              endColumn: 2,
            },
          },
        },
      ],
    },
    title: 'Require braces around arrow function bodies',
    description: 'ESLint rule **arrow-body-style**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/arrow-body-style',
  },
  camelcase: {
    slug: 'camelcase',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Enforce camelcase naming convention',
    description: 'ESLint rule **camelcase**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/camelcase',
  },
  curly: {
    slug: 'curly',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Enforce consistent brace style for all control statements',
    description: 'ESLint rule **curly**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/curly',
  },
  eqeqeq: {
    slug: 'eqeqeq',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message: "Expected '===' and instead saw '=='.",
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 41,
              startColumn: 41,
              endLine: 41,
              endColumn: 43,
            },
          },
        },
      ],
    },
    title: 'Require the use of `===` and `!==`',
    description: 'ESLint rule **eqeqeq**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/eqeqeq',
  },
  'max-lines-per-function': {
    slug: 'max-lines-per-function',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message:
            'Arrow function has too many lines (71). Maximum allowed is 50.',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 3,
              startColumn: 25,
              endLine: 73,
              endColumn: 2,
            },
          },
        },
      ],
    },
    title: 'Enforce a maximum number of lines of code in a function',
    description: 'ESLint rule **max-lines-per-function**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/max-lines-per-function',
  },
  'max-lines': {
    slug: 'max-lines',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Enforce a maximum number of lines per file',
    description: 'ESLint rule **max-lines**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/max-lines',
  },
  'no-shadow': {
    slug: 'no-shadow',
    displayValue: '3 warnings',
    value: 3,
    score: 0,
    details: {
      issues: [
        {
          message:
            "'data' is already declared in the upper scope on line 5 column 10.",
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 11,
              startColumn: 13,
              endLine: 11,
              endColumn: 17,
            },
          },
        },
        {
          message:
            "'data' is already declared in the upper scope on line 5 column 10.",
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 29,
              startColumn: 17,
              endLine: 29,
              endColumn: 21,
            },
          },
        },
        {
          message:
            "'data' is already declared in the upper scope on line 5 column 10.",
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 41,
              startColumn: 13,
              endLine: 41,
              endColumn: 17,
            },
          },
        },
      ],
    },
    title:
      'Disallow variable declarations from shadowing variables declared in the outer scope',
    description: 'ESLint rule **no-shadow**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-shadow',
  },
  'no-var': {
    slug: 'no-var',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Require `let` or `const` instead of `var`',
    description: 'ESLint rule **no-var**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/no-var',
  },
  'object-shorthand': {
    slug: 'object-shorthand',
    displayValue: '3 warnings',
    value: 3,
    score: 0,
    details: {
      issues: [
        {
          message: 'Expected property shorthand.',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 19,
              startColumn: 7,
              endLine: 19,
              endColumn: 19,
            },
          },
        },
        {
          message: 'Expected property shorthand.',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 32,
              startColumn: 13,
              endLine: 32,
              endColumn: 19,
            },
          },
        },
        {
          message: 'Expected property shorthand.',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 33,
              startColumn: 13,
              endLine: 33,
              endColumn: 25,
            },
          },
        },
      ],
    },
    title:
      'Require or disallow method and property shorthand syntax for object literals',
    description: 'ESLint rule **object-shorthand**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/object-shorthand',
  },
  'prefer-arrow-callback': {
    slug: 'prefer-arrow-callback',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Require using arrow functions for callbacks',
    description: 'ESLint rule **prefer-arrow-callback**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/prefer-arrow-callback',
  },
  'prefer-const': {
    slug: 'prefer-const',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message: "'root' is never reassigned. Use 'const' instead.",
          severity: 'warning',
          source: {
            file: 'src/index.jsx',
            position: {
              startLine: 5,
              startColumn: 5,
              endLine: 5,
              endColumn: 9,
            },
          },
        },
      ],
    },
    title:
      'Require `const` declarations for variables that are never reassigned after declared',
    description: 'ESLint rule **prefer-const**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/prefer-const',
  },
  'prefer-object-spread': {
    slug: 'prefer-object-spread',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title:
      'Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead',
    description: 'ESLint rule **prefer-object-spread**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/prefer-object-spread',
  },
  yoda: {
    slug: 'yoda',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Require or disallow "Yoda" conditions',
    description: 'ESLint rule **yoda**.',
    docsUrl: 'https://eslint.org/docs/latest/rules/yoda',
  },
  'react-jsx-key': {
    slug: 'react-jsx-key',
    displayValue: '1 warning',
    value: 1,
    score: 0,
    details: {
      issues: [
        {
          message: 'Missing "key" prop for element in iterator',
          severity: 'warning',
          source: {
            file: 'src/components/TodoList.jsx',
            position: {
              startLine: 7,
              startColumn: 7,
              endLine: 28,
              endColumn: 12,
            },
          },
        },
      ],
    },
    title: 'Disallow missing `key` props in iterators/collection literals',
    description: 'ESLint rule **jsx-key**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md',
  },
  'react-prop-types': {
    slug: 'react-prop-types',
    displayValue: '6 warnings',
    value: 6,
    score: 0,
    details: {
      issues: [
        {
          message: "'onCreate' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/CreateTodo.jsx',
            position: {
              startLine: 15,
              startColumn: 15,
              endLine: 15,
              endColumn: 23,
            },
          },
        },
        {
          message: "'setQuery' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/TodoFilter.jsx',
            position: {
              startLine: 10,
              startColumn: 17,
              endLine: 10,
              endColumn: 25,
            },
          },
        },
        {
          message: "'setHideComplete' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/TodoFilter.jsx',
            position: {
              startLine: 18,
              startColumn: 19,
              endLine: 18,
              endColumn: 34,
            },
          },
        },
        {
          message: "'todos' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/TodoList.jsx',
            position: {
              startLine: 6,
              startColumn: 12,
              endLine: 6,
              endColumn: 17,
            },
          },
        },
        {
          message: "'todos.map' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/TodoList.jsx',
            position: {
              startLine: 6,
              startColumn: 18,
              endLine: 6,
              endColumn: 21,
            },
          },
        },
        {
          message: "'onEdit' is missing in props validation",
          severity: 'warning',
          source: {
            file: 'src/components/TodoList.jsx',
            position: {
              startLine: 13,
              startColumn: 21,
              endLine: 13,
              endColumn: 27,
            },
          },
        },
      ],
    },
    title: 'Disallow missing props validation in a React component definition',
    description: 'ESLint rule **prop-types**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/prop-types.md',
  },
  'react-react-in-jsx-scope': {
    slug: 'react-react-in-jsx-scope',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow missing React when using JSX',
    description: 'ESLint rule **react-in-jsx-scope**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/react-in-jsx-scope.md',
  },
  'react-hooks-rules-of-hooks': {
    slug: 'react-hooks-rules-of-hooks',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'enforces the Rules of Hooks',
    description: 'ESLint rule **rules-of-hooks**, from _react-hooks_ plugin.',
    docsUrl: 'https://reactjs.org/docs/hooks-rules.html',
  },
  'react-hooks-exhaustive-deps': {
    slug: 'react-hooks-exhaustive-deps',
    displayValue: '2 warnings',
    value: 2,
    score: 0,
    details: {
      issues: [
        {
          message:
            'React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies?',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 17,
              startColumn: 20,
              endLine: 17,
              endColumn: 31,
            },
          },
        },
        {
          message:
            'React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies?',
          severity: 'warning',
          source: {
            file: 'src/hooks/useTodos.js',
            position: {
              startLine: 40,
              startColumn: 18,
              endLine: 40,
              endColumn: 29,
            },
          },
        },
      ],
    },
    title:
      'verifies the list of dependencies for Hooks like useEffect and similar',
    description: 'ESLint rule **exhaustive-deps**, from _react-hooks_ plugin.',
    docsUrl: 'https://github.com/facebook/react/issues/14920',
  },
  'react-display-name': {
    slug: 'react-display-name',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow missing displayName in a React component definition',
    description: 'ESLint rule **display-name**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/display-name.md',
  },
  'react-jsx-no-comment-textnodes': {
    slug: 'react-jsx-no-comment-textnodes',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow comments from being inserted as text nodes',
    description:
      'ESLint rule **jsx-no-comment-textnodes**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-comment-textnodes.md',
  },
  'react-jsx-no-duplicate-props': {
    slug: 'react-jsx-no-duplicate-props',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow duplicate properties in JSX',
    description: 'ESLint rule **jsx-no-duplicate-props**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-duplicate-props.md',
  },
  'react-jsx-no-target-blank': {
    slug: 'react-jsx-no-target-blank',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow `target="_blank"` attribute without `rel="noreferrer"`',
    description: 'ESLint rule **jsx-no-target-blank**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-target-blank.md',
  },
  'react-jsx-no-undef': {
    slug: 'react-jsx-no-undef',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow undeclared variables in JSX',
    description: 'ESLint rule **jsx-no-undef**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-undef.md',
  },
  'react-jsx-uses-react': {
    slug: 'react-jsx-uses-react',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow React to be incorrectly marked as unused',
    description: 'ESLint rule **jsx-uses-react**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-react.md',
  },
  'react-jsx-uses-vars': {
    slug: 'react-jsx-uses-vars',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow variables used in JSX to be incorrectly marked as unused',
    description: 'ESLint rule **jsx-uses-vars**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-vars.md',
  },
  'react-no-children-prop': {
    slug: 'react-no-children-prop',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow passing of children as props',
    description: 'ESLint rule **no-children-prop**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-children-prop.md',
  },
  'react-no-danger-with-children': {
    slug: 'react-no-danger-with-children',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title:
      'Disallow when a DOM element is using both children and dangerouslySetInnerHTML',
    description:
      'ESLint rule **no-danger-with-children**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-danger-with-children.md',
  },
  'react-no-deprecated': {
    slug: 'react-no-deprecated',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow usage of deprecated methods',
    description: 'ESLint rule **no-deprecated**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-deprecated.md',
  },
  'react-no-direct-mutation-state': {
    slug: 'react-no-direct-mutation-state',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow direct mutation of this.state',
    description:
      'ESLint rule **no-direct-mutation-state**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-direct-mutation-state.md',
  },
  'react-no-find-dom-node': {
    slug: 'react-no-find-dom-node',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow usage of findDOMNode',
    description: 'ESLint rule **no-find-dom-node**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-find-dom-node.md',
  },
  'react-no-is-mounted': {
    slug: 'react-no-is-mounted',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow usage of isMounted',
    description: 'ESLint rule **no-is-mounted**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-is-mounted.md',
  },
  'react-no-render-return-value': {
    slug: 'react-no-render-return-value',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow usage of the return value of ReactDOM.render',
    description: 'ESLint rule **no-render-return-value**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-render-return-value.md',
  },
  'react-no-string-refs': {
    slug: 'react-no-string-refs',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow using string references',
    description: 'ESLint rule **no-string-refs**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-string-refs.md',
  },
  'react-no-unescaped-entities': {
    slug: 'react-no-unescaped-entities',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow unescaped HTML entities from appearing in markup',
    description: 'ESLint rule **no-unescaped-entities**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unescaped-entities.md',
  },
  'react-no-unknown-property': {
    slug: 'react-no-unknown-property',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Disallow usage of unknown DOM property',
    description: 'ESLint rule **no-unknown-property**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unknown-property.md',
  },
  'react-require-render-return': {
    slug: 'react-require-render-return',
    displayValue: 'passed',
    value: 0,
    score: 1,
    details: { issues: [] },
    title: 'Enforce ES5 or ES6 class for returning value in render function',
    description: 'ESLint rule **require-render-return**, from _react_ plugin.',
    docsUrl:
      'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/require-render-return.md',
  },
} satisfies Record<string, AuditReport>;

export const ESLINT_AUDIT_SLUGS = Object.keys(
  ESLINT_AUDITS_MAP,
) as (keyof typeof ESLINT_AUDITS_MAP)[];
