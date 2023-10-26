/**
 * @param {import('../../packages/models/src').CategoryConfig} category
 * @param {import('../../packages/models/src').PluginConfig[]} plugins
 */
export function countAudits(category, plugins) {
  const counts = category.refs.map(ref => {
    if (ref.type === 'audit') {
      return 1;
    }
    const group = plugins
      .find(plugin => plugin.slug === ref.plugin)
      ?.groups?.find(group => group.slug === ref.slug);
    return group.refs.length;
  });
  return counts.reduce((acc, count) => acc + count, 0);
}

/** @type {import('../../packages/models/src').Report} */
export const report = {
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        {
          type: 'group',
          plugin: 'lighthouse',
          slug: 'performance',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'react-jsx-key',
          type: 'audit',
          weight: 0,
        },
      ],
      score: 0.92,
    },
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        {
          plugin: 'eslint',
          slug: 'no-cond-assign',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-const-assign',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-debugger',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-invalid-regexp',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-undef',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-unreachable-loop',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-unsafe-negation',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-unsafe-optional-chaining',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'use-isnan',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'valid-typeof',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'eqeqeq',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'react-jsx-key',
          type: 'audit',
          weight: 2,
        },
        {
          plugin: 'eslint',
          slug: 'react-prop-types',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'react-react-in-jsx-scope',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'react-hooks-rules-of-hooks',
          type: 'audit',
          weight: 2,
        },
        {
          plugin: 'eslint',
          slug: 'react-hooks-exhaustive-deps',
          type: 'audit',
          weight: 2,
        },
      ],
      score: 0.68,
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        {
          plugin: 'eslint',
          slug: 'no-unused-vars',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'arrow-body-style',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'camelcase',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'curly',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'eqeqeq',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'max-lines-per-function',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'max-lines',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'object-shorthand',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'prefer-arrow-callback',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'prefer-const',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'prefer-object-spread',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'yoda',
          type: 'audit',
          weight: 1,
        },
        {
          plugin: 'eslint',
          slug: 'no-var',
          type: 'audit',
          weight: 1,
        },
      ],
      score: 0.54,
    },
  ],
  packageName: '@code-pushup/core',
  plugins: [
    {
      slug: 'eslint',
      title: 'ESLint',
      icon: 'eslint',
      description: 'Official Code PushUp ESLint plugin',
      packageName: '@code-pushup/eslint-plugin',
      audits: [
        {
          description: 'ESLint rule **no-cond-assign**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-cond-assign',
          score: 1,
          slug: 'no-cond-assign',
          title: 'Disallow assignment operators in conditional expressions',
          value: 0,
        },
        {
          description: 'ESLint rule **no-const-assign**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-const-assign',
          score: 1,
          slug: 'no-const-assign',
          title: 'Disallow reassigning `const` variables',
          value: 0,
        },
        {
          description: 'ESLint rule **no-debugger**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-debugger',
          score: 1,
          slug: 'no-debugger',
          title: 'Disallow the use of `debugger`',
          value: 0,
        },
        {
          description: 'ESLint rule **no-invalid-regexp**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-invalid-regexp',
          score: 1,
          slug: 'no-invalid-regexp',
          title:
            'Disallow invalid regular expression strings in `RegExp` constructors',
          value: 0,
        },
        {
          description: 'ESLint rule **no-undef**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-undef',
          score: 1,
          slug: 'no-undef',
          title:
            'Disallow the use of undeclared variables unless mentioned in `/*global */` comments',
          value: 0,
        },
        {
          description: 'ESLint rule **no-unreachable-loop**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-unreachable-loop',
          score: 1,
          slug: 'no-unreachable-loop',
          title: 'Disallow loops with a body that allows only one iteration',
          value: 0,
        },
        {
          description: 'ESLint rule **no-unsafe-negation**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-unsafe-negation',
          score: 1,
          slug: 'no-unsafe-negation',
          title: 'Disallow negating the left operand of relational operators',
          value: 0,
        },
        {
          description: 'ESLint rule **no-unsafe-optional-chaining**.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining',
          score: 1,
          slug: 'no-unsafe-optional-chaining',
          title:
            'Disallow use of optional chaining in contexts where the `undefined` value is not allowed',
          value: 0,
        },
        {
          description: 'ESLint rule **no-unused-vars**.',
          details: {
            issues: [
              {
                message: "'loading' is assigned a value but never used.",
                severity: 'warning',
                source: {
                  file: 'src/App.jsx',
                  position: {
                    endColumn: 18,
                    endLine: 8,
                    startColumn: 11,
                    startLine: 8,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl: 'https://eslint.org/docs/latest/rules/no-unused-vars',
          score: 0,
          slug: 'no-unused-vars',
          title: 'Disallow unused variables',
          value: 1,
        },
        {
          description: 'ESLint rule **use-isnan**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/use-isnan',
          score: 1,
          slug: 'use-isnan',
          title: 'Require calls to `isNaN()` when checking for `NaN`',
          value: 0,
        },
        {
          description: 'ESLint rule **valid-typeof**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/valid-typeof',
          score: 1,
          slug: 'valid-typeof',
          title: 'Enforce comparing `typeof` expressions against valid strings',
          value: 0,
        },
        {
          description: 'ESLint rule **arrow-body-style**.',
          details: {
            issues: [
              {
                message:
                  'Unexpected block statement surrounding arrow body; move the returned value immediately after the `=>`.',
                severity: 'warning',
                source: {
                  file: 'src/components/TodoFilter.jsx',
                  position: {
                    endColumn: 2,
                    endLine: 25,
                    startColumn: 29,
                    startLine: 3,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl: 'https://eslint.org/docs/latest/rules/arrow-body-style',
          score: 0,
          slug: 'arrow-body-style',
          title: 'Require braces around arrow function bodies',
          value: 1,
        },
        {
          description: 'ESLint rule **camelcase**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/camelcase',
          score: 1,
          slug: 'camelcase',
          title: 'Enforce camelcase naming convention',
          value: 0,
        },
        {
          description: 'ESLint rule **curly**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/curly',
          score: 1,
          slug: 'curly',
          title: 'Enforce consistent brace style for all control statements',
          value: 0,
        },
        {
          description: 'ESLint rule **eqeqeq**.',
          details: {
            issues: [
              {
                message: "Expected '===' and instead saw '=='.",
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 43,
                    endLine: 41,
                    startColumn: 41,
                    startLine: 41,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl: 'https://eslint.org/docs/latest/rules/eqeqeq',
          score: 0,
          slug: 'eqeqeq',
          title: 'Require the use of `===` and `!==`',
          value: 1,
        },
        {
          description: 'ESLint rule **max-lines-per-function**.',
          details: {
            issues: [
              {
                message:
                  'Arrow function has too many lines (71). Maximum allowed is 50.',
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 2,
                    endLine: 73,
                    startColumn: 25,
                    startLine: 3,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl:
            'https://eslint.org/docs/latest/rules/max-lines-per-function',
          score: 0,
          slug: 'max-lines-per-function',
          title: 'Enforce a maximum number of lines of code in a function',
          value: 1,
        },
        {
          description: 'ESLint rule **max-lines**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/max-lines',
          score: 1,
          slug: 'max-lines',
          title: 'Enforce a maximum number of lines per file',
          value: 0,
        },
        {
          description: 'ESLint rule **no-shadow**.',
          details: {
            issues: [
              {
                message:
                  "'data' is already declared in the upper scope on line 5 column 10.",
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 17,
                    endLine: 11,
                    startColumn: 13,
                    startLine: 11,
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
                    endColumn: 21,
                    endLine: 29,
                    startColumn: 17,
                    startLine: 29,
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
                    endColumn: 17,
                    endLine: 41,
                    startColumn: 13,
                    startLine: 41,
                  },
                },
              },
            ],
          },
          displayValue: '3 warnings',
          docsUrl: 'https://eslint.org/docs/latest/rules/no-shadow',
          score: 0,
          slug: 'no-shadow',
          title:
            'Disallow variable declarations from shadowing variables declared in the outer scope',
          value: 3,
        },
        {
          description: 'ESLint rule **no-var**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/no-var',
          score: 1,
          slug: 'no-var',
          title: 'Require `let` or `const` instead of `var`',
          value: 0,
        },
        {
          description: 'ESLint rule **object-shorthand**.',
          details: {
            issues: [
              {
                message: 'Expected property shorthand.',
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 19,
                    endLine: 19,
                    startColumn: 7,
                    startLine: 19,
                  },
                },
              },
              {
                message: 'Expected property shorthand.',
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 19,
                    endLine: 32,
                    startColumn: 13,
                    startLine: 32,
                  },
                },
              },
              {
                message: 'Expected property shorthand.',
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 25,
                    endLine: 33,
                    startColumn: 13,
                    startLine: 33,
                  },
                },
              },
            ],
          },
          displayValue: '3 warnings',
          docsUrl: 'https://eslint.org/docs/latest/rules/object-shorthand',
          score: 0,
          slug: 'object-shorthand',
          title:
            'Require or disallow method and property shorthand syntax for object literals',
          value: 3,
        },
        {
          description: 'ESLint rule **prefer-arrow-callback**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/prefer-arrow-callback',
          score: 1,
          slug: 'prefer-arrow-callback',
          title: 'Require using arrow functions for callbacks',
          value: 0,
        },
        {
          description: 'ESLint rule **prefer-const**.',
          details: {
            issues: [
              {
                message: "'root' is never reassigned. Use 'const' instead.",
                severity: 'warning',
                source: {
                  file: 'src/index.jsx',
                  position: {
                    endColumn: 9,
                    endLine: 5,
                    startColumn: 5,
                    startLine: 5,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl: 'https://eslint.org/docs/latest/rules/prefer-const',
          score: 0,
          slug: 'prefer-const',
          title:
            'Require `const` declarations for variables that are never reassigned after declared',
          value: 1,
        },
        {
          description: 'ESLint rule **prefer-object-spread**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/prefer-object-spread',
          score: 1,
          slug: 'prefer-object-spread',
          title:
            'Disallow using Object.assign with an object literal as the first argument and prefer the use of object spread instead',
          value: 0,
        },
        {
          description: 'ESLint rule **yoda**.',
          details: {
            issues: [],
          },
          docsUrl: 'https://eslint.org/docs/latest/rules/yoda',
          score: 1,
          slug: 'yoda',
          title: 'Require or disallow "Yoda" conditions',
          value: 0,
        },
        {
          description: 'ESLint rule **jsx-key**, from _react_ plugin.',
          details: {
            issues: [
              {
                message: 'Missing "key" prop for element in iterator',
                severity: 'warning',
                source: {
                  file: 'src/components/TodoList.jsx',
                  position: {
                    endColumn: 12,
                    endLine: 28,
                    startColumn: 7,
                    startLine: 7,
                  },
                },
              },
            ],
          },
          displayValue: '1 warning',
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md',
          score: 0,
          slug: 'react-jsx-key',
          title:
            'Disallow missing `key` props in iterators/collection literals',
          value: 1,
        },
        {
          description: 'ESLint rule **prop-types**, from _react_ plugin.',
          details: {
            issues: [
              {
                message: "'onCreate' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/CreateTodo.jsx',
                  position: {
                    endColumn: 23,
                    endLine: 15,
                    startColumn: 15,
                    startLine: 15,
                  },
                },
              },
              {
                message: "'setQuery' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/TodoFilter.jsx',
                  position: {
                    endColumn: 25,
                    endLine: 10,
                    startColumn: 17,
                    startLine: 10,
                  },
                },
              },
              {
                message: "'setHideComplete' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/TodoFilter.jsx',
                  position: {
                    endColumn: 34,
                    endLine: 18,
                    startColumn: 19,
                    startLine: 18,
                  },
                },
              },
              {
                message: "'todos' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/TodoList.jsx',
                  position: {
                    endColumn: 17,
                    endLine: 6,
                    startColumn: 12,
                    startLine: 6,
                  },
                },
              },
              {
                message: "'todos.map' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/TodoList.jsx',
                  position: {
                    endColumn: 21,
                    endLine: 6,
                    startColumn: 18,
                    startLine: 6,
                  },
                },
              },
              {
                message: "'onEdit' is missing in props validation",
                severity: 'warning',
                source: {
                  file: 'src/components/TodoList.jsx',
                  position: {
                    endColumn: 27,
                    endLine: 13,
                    startColumn: 21,
                    startLine: 13,
                  },
                },
              },
            ],
          },
          displayValue: '6 warnings',
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/prop-types.md',
          score: 0,
          slug: 'react-prop-types',
          title:
            'Disallow missing props validation in a React component definition',
          value: 6,
        },
        {
          description:
            'ESLint rule **react-in-jsx-scope**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/react-in-jsx-scope.md',
          score: 1,
          slug: 'react-react-in-jsx-scope',
          title: 'Disallow missing React when using JSX',
          value: 0,
        },
        {
          description:
            'ESLint rule **rules-of-hooks**, from _react-hooks_ plugin.',
          details: {
            issues: [],
          },
          docsUrl: 'https://reactjs.org/docs/hooks-rules.html',
          score: 1,
          slug: 'react-hooks-rules-of-hooks',
          title: 'enforces the Rules of Hooks',
          value: 0,
        },
        {
          description:
            'ESLint rule **exhaustive-deps**, from _react-hooks_ plugin.',
          details: {
            issues: [
              {
                message:
                  'React Hook useCallback does nothing when called with only one argument. Did you forget to pass an array of dependencies?',
                severity: 'warning',
                source: {
                  file: 'src/hooks/useTodos.js',
                  position: {
                    endColumn: 31,
                    endLine: 17,
                    startColumn: 20,
                    startLine: 17,
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
                    endColumn: 29,
                    endLine: 40,
                    startColumn: 18,
                    startLine: 40,
                  },
                },
              },
            ],
          },
          displayValue: '2 warnings',
          docsUrl: 'https://github.com/facebook/react/issues/14920',
          score: 0,
          slug: 'react-hooks-exhaustive-deps',
          title:
            'verifies the list of dependencies for Hooks like useEffect and similar',
          value: 2,
        },
        {
          description: 'ESLint rule **display-name**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/display-name.md',
          score: 1,
          slug: 'react-display-name',
          title: 'Disallow missing displayName in a React component definition',
          value: 0,
        },
        {
          description:
            'ESLint rule **jsx-no-comment-textnodes**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-comment-textnodes.md',
          score: 1,
          slug: 'react-jsx-no-comment-textnodes',
          title: 'Disallow comments from being inserted as text nodes',
          value: 0,
        },
        {
          description:
            'ESLint rule **jsx-no-duplicate-props**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-duplicate-props.md',
          score: 1,
          slug: 'react-jsx-no-duplicate-props',
          title: 'Disallow duplicate properties in JSX',
          value: 0,
        },
        {
          description:
            'ESLint rule **jsx-no-target-blank**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-target-blank.md',
          score: 1,
          slug: 'react-jsx-no-target-blank',
          title:
            'Disallow `target="_blank"` attribute without `rel="noreferrer"`',
          value: 0,
        },
        {
          description: 'ESLint rule **jsx-no-undef**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-no-undef.md',
          score: 1,
          slug: 'react-jsx-no-undef',
          title: 'Disallow undeclared variables in JSX',
          value: 0,
        },
        {
          description: 'ESLint rule **jsx-uses-react**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-react.md',
          score: 1,
          slug: 'react-jsx-uses-react',
          title: 'Disallow React to be incorrectly marked as unused',
          value: 0,
        },
        {
          description: 'ESLint rule **jsx-uses-vars**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-uses-vars.md',
          score: 1,
          slug: 'react-jsx-uses-vars',
          title:
            'Disallow variables used in JSX to be incorrectly marked as unused',
          value: 0,
        },
        {
          description: 'ESLint rule **no-children-prop**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-children-prop.md',
          score: 1,
          slug: 'react-no-children-prop',
          title: 'Disallow passing of children as props',
          value: 0,
        },
        {
          description:
            'ESLint rule **no-danger-with-children**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-danger-with-children.md',
          score: 1,
          slug: 'react-no-danger-with-children',
          title:
            'Disallow when a DOM element is using both children and dangerouslySetInnerHTML',
          value: 0,
        },
        {
          description: 'ESLint rule **no-deprecated**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-deprecated.md',
          score: 1,
          slug: 'react-no-deprecated',
          title: 'Disallow usage of deprecated methods',
          value: 0,
        },
        {
          description:
            'ESLint rule **no-direct-mutation-state**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-direct-mutation-state.md',
          score: 1,
          slug: 'react-no-direct-mutation-state',
          title: 'Disallow direct mutation of this.state',
          value: 0,
        },
        {
          description: 'ESLint rule **no-find-dom-node**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-find-dom-node.md',
          score: 1,
          slug: 'react-no-find-dom-node',
          title: 'Disallow usage of findDOMNode',
          value: 0,
        },
        {
          description: 'ESLint rule **no-is-mounted**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-is-mounted.md',
          score: 1,
          slug: 'react-no-is-mounted',
          title: 'Disallow usage of isMounted',
          value: 0,
        },
        {
          description:
            'ESLint rule **no-render-return-value**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-render-return-value.md',
          score: 1,
          slug: 'react-no-render-return-value',
          title: 'Disallow usage of the return value of ReactDOM.render',
          value: 0,
        },
        {
          description: 'ESLint rule **no-string-refs**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-string-refs.md',
          score: 1,
          slug: 'react-no-string-refs',
          title: 'Disallow using string references',
          value: 0,
        },
        {
          description:
            'ESLint rule **no-unescaped-entities**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unescaped-entities.md',
          score: 1,
          slug: 'react-no-unescaped-entities',
          title: 'Disallow unescaped HTML entities from appearing in markup',
          value: 0,
        },
        {
          description:
            'ESLint rule **no-unknown-property**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-unknown-property.md',
          score: 1,
          slug: 'react-no-unknown-property',
          title: 'Disallow usage of unknown DOM property',
          value: 0,
        },
        {
          description:
            'ESLint rule **require-render-return**, from _react_ plugin.',
          details: {
            issues: [],
          },
          docsUrl:
            'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/require-render-return.md',
          score: 1,
          slug: 'react-require-render-return',
          title:
            'Enforce ES5 or ES6 class for returning value in render function',
          value: 0,
        },
      ],
    },
    {
      slug: 'lighthouse',
      title: 'Lighthouse',
      icon: 'lighthouse',
      description: 'Official Code PushUp Lighthouse plugin',
      packageName: '@code-pushup/lighthouse-plugin',
      groups: [
        {
          slug: 'performance',
          title: 'Performance',
          refs: [
            {
              slug: 'first-contentful-paint',
              weight: 10,
            },
            {
              slug: 'largest-contentful-paint',
              weight: 25,
            },
            {
              slug: 'speed-index',
              weight: 10,
            },
            {
              slug: 'total-blocking-time',
              weight: 30,
            },
            {
              slug: 'cumulative-layout-shift',
              weight: 25,
            },
          ],
        },
      ],
      audits: [
        {
          slug: 'first-contentful-paint',
          title: 'First Contentful Paint',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/',
          score: 0.76,
          value: 1189,
          displayValue: '1.2 s',
        },
        {
          slug: 'largest-contentful-paint',
          title: 'Largest Contentful Paint',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/',
          score: 0.81,
          value: 1491,
          displayValue: '1.5 s',
        },
        {
          slug: 'total-blocking-time',
          title: 'Total Blocking Time',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/',
          score: 1,
          value: 0,
          displayValue: '0 ms',
        },
        {
          slug: 'cumulative-layout-shift',
          title: 'Cumulative Layout Shift',
          docsUrl: 'https://web.dev/cls/',
          score: 1,
          value: 0,
          displayValue: '0',
        },
        {
          slug: 'speed-index',
          title: 'Speed Index',
          docsUrl:
            'https://developer.chrome.com/docs/lighthouse/performance/speed-index/',
          score: 0.93,
          value: 1189,
          displayValue: '1.2 s',
        },
      ],
    },
  ],
};
