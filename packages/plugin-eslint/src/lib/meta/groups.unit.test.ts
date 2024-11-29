import type { Group } from '@code-pushup/models';
import { groupsFromRuleCategories, groupsFromRuleTypes } from './groups.js';
import type { RuleData } from './parse.js';

const eslintRules: RuleData[] = [
  {
    ruleId: 'no-var',
    meta: {
      docs: {
        description: 'Require `let` or `const` instead of `var`',
        recommended: false,
        url: 'https://eslint.org/docs/latest/rules/no-var',
      },
      fixable: 'code',
      messages: {
        unexpectedVar: 'Unexpected var, use let or const instead.',
      },
      schema: [],
      type: 'suggestion',
    },
    options: [],
  },
  {
    ruleId: 'no-const-assign',
    meta: {
      docs: {
        description: 'Disallow reassigning `const` variables',
        recommended: true,
        url: 'https://eslint.org/docs/latest/rules/no-const-assign',
      },
      messages: {
        const: "'{{name}}' is constant.",
      },
      schema: [],
      type: 'problem',
    },
    options: [],
  },
  {
    ruleId: 'no-debugger',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow the use of `debugger`',
        recommended: true,
        url: 'https://eslint.org/docs/latest/rules/no-debugger',
      },
      schema: [],
      messages: {
        unexpected: "Unexpected 'debugger' statement.",
      },
    },
    options: [],
  },
  {
    ruleId: 'react/jsx-key',
    meta: {
      docs: {
        category: 'Possible Errors',
        description:
          'Disallow missing `key` props in iterators/collection literals',
        recommended: true,
        url: 'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md',
      },
    },
    options: [],
  },
  {
    ruleId: 'react/react-in-jsx-scope',
    meta: {
      docs: {
        description: 'Disallow missing React when using JSX',
        category: 'Possible Errors',
        recommended: true,
        url: 'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/react-in-jsx-scope.md',
      },
      messages: {
        notInScope: "'{{name}}' must be in scope when using JSX",
      },
      schema: [],
    },
    options: [],
  },
  {
    ruleId: 'react/no-deprecated',
    meta: {
      docs: {
        description: 'Disallow usage of deprecated methods',
        category: 'Best Practices',
        recommended: true,
        url: 'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/no-deprecated.md',
      },
      messages: {
        deprecated:
          '{{oldMethod}} is deprecated since React {{version}}{{newMethod}}{{refs}}',
      },
      schema: [],
    },
    options: [],
  },
  {
    ruleId: '@typescript-eslint/no-array-constructor',
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow generic `Array` constructors',
        // @ts-expect-error this is actual metadata for this rule
        recommended: 'error',
        extendsBaseRule: true,
        url: 'https://typescript-eslint.io/rules/no-array-constructor',
      },
      fixable: 'code',
      messages: {
        useLiteral: 'The array literal notation [] is preferable.',
      },
      schema: [],
    },
    options: [],
  },
];

describe('groupsFromRuleTypes', () => {
  it("should create groups based on rules' meta.type", () => {
    expect(groupsFromRuleTypes(eslintRules)).toEqual<Group[]>([
      {
        slug: 'problems',
        title: 'Problems',
        description:
          'Code that either will cause an error or may cause confusing behavior. Developers should consider this a high priority to resolve.',
        refs: [
          { slug: 'no-const-assign', weight: 1 },
          { slug: 'no-debugger', weight: 1 },
        ],
      },
      {
        slug: 'suggestions',
        title: 'Suggestions',
        description:
          "Something that could be done in a better way but no errors will occur if the code isn't changed.",
        refs: [
          { slug: 'no-var', weight: 1 },
          { slug: 'typescript-eslint-no-array-constructor', weight: 1 },
        ],
      },
    ]);
  });
});

describe('groupsFromRuleCategories', () => {
  it("should create groups based on rules' meta.docs.category", () => {
    expect(groupsFromRuleCategories(eslintRules)).toEqual<Group[]>([
      {
        slug: 'react-best-practices',
        title: 'Best Practices (react)',
        refs: [{ slug: 'react-no-deprecated', weight: 1 }],
      },
      {
        slug: 'react-possible-errors',
        title: 'Possible Errors (react)',
        refs: [
          { slug: 'react-jsx-key', weight: 1 },
          { slug: 'react-react-in-jsx-scope', weight: 1 },
        ],
      },
    ]);
  });
});
