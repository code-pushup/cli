import type { Group } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import {
  createRulesMap,
  groupsFromCustomConfig,
  groupsFromRuleCategories,
  groupsFromRuleTypes,
  resolveGroupRefs,
} from './groups.js';
import type { RuleData } from './parse.js';

const eslintRules: RuleData[] = [
  {
    id: 'no-var',
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
    id: 'no-const-assign',
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
    id: 'no-debugger',
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
    id: 'react/jsx-key',
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
    id: 'react/react-in-jsx-scope',
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
    id: 'react/no-deprecated',
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
    id: '@typescript-eslint/no-array-constructor',
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

describe('groupsFromCustomConfig', () => {
  it('should create a group with refs for wildcard rules', () => {
    expect(
      groupsFromCustomConfig(eslintRules, [
        {
          slug: 'react',
          title: 'React',
          rules: ['react/*'],
        },
      ]),
    ).toEqual<Group[]>([
      {
        slug: 'react',
        title: 'React',
        refs: [
          { slug: 'react-jsx-key', weight: 1 },
          { slug: 'react-react-in-jsx-scope', weight: 1 },
          { slug: 'react-no-deprecated', weight: 1 },
        ],
      },
    ]);
  });

  it('should create a group with custom weights for specific rules', () => {
    expect(
      groupsFromCustomConfig(eslintRules, [
        {
          slug: 'react',
          title: 'React',
          rules: {
            'react/jsx-key': 3,
            'react/react-in-jsx-scope': 2,
            'react/no-deprecated': 1,
          },
        },
      ]),
    ).toEqual<Group[]>([
      {
        slug: 'react',
        title: 'React',
        refs: [
          { slug: 'react-jsx-key', weight: 3 },
          { slug: 'react-react-in-jsx-scope', weight: 2 },
          { slug: 'react-no-deprecated', weight: 1 },
        ],
      },
    ]);
  });

  it('should handle multiple instances of the same rule', () => {
    const rule: RuleData = {
      id: 'promise/always-return',
      options: [{ ignoreLastCallback: true }],
      meta: {
        type: 'problem',
        docs: {
          description:
            'Require returning inside each `then()` to create readable and reusable Promise chains.',
          url: 'https://github.com/eslint-community/eslint-plugin-promise/blob/main/docs/rules/always-return.md',
        },
        schema: [],
        messages: {
          thenShouldReturnOrThrow: 'Each then() should return a value or throw',
        },
      },
    };
    expect(
      groupsFromCustomConfig(
        [rule, { ...rule, options: [] }],
        [{ slug: 'custom-group', title: 'Custom Group', rules: ['promise/*'] }],
      ),
    ).toEqual<Group[]>([
      {
        slug: 'custom-group',
        title: 'Custom Group',
        refs: [
          { slug: 'promise-always-return-ae56718b964cc0c7', weight: 0.5 },
          { slug: 'promise-always-return', weight: 0.5 },
        ],
      },
    ]);
  });

  it('should throw when rules are empty', () => {
    expect(() =>
      groupsFromCustomConfig(
        [],
        [
          {
            slug: 'custom-group',
            title: 'Custom Group',
            rules: ['react/*'],
          },
        ],
      ),
    ).toThrow(
      'Invalid rule configuration in group custom-group. All rules are invalid.',
    );
  });

  it('should throw when all custom group rules are invalid', () => {
    expect(() =>
      groupsFromCustomConfig(eslintRules, [
        {
          slug: 'custom-group',
          title: 'Custom Group',
          rules: ['non-existent/*'],
        },
      ]),
    ).toThrow(
      'Invalid rule configuration in group custom-group. All rules are invalid.',
    );
  });

  it('should log a warning when some of custom group rules are invalid', () => {
    expect(
      groupsFromCustomConfig(eslintRules, [
        {
          slug: 'custom-group',
          title: 'Custom Group',
          rules: {
            'react/jsx-key': 3,
            'invalid-rule': 3,
          },
        },
      ]),
    ).toEqual<Group[]>([
      {
        slug: 'custom-group',
        title: 'Custom Group',
        refs: [{ slug: 'react-jsx-key', weight: 3 }],
      },
    ]);
    expect(ui()).toHaveLogged(
      'warn',
      'Some rules in group custom-group are invalid: invalid-rule',
    );
  });
});

describe('createRulesMap', () => {
  it('should map rule IDs to arrays of RuleData objects', () => {
    expect(
      createRulesMap([
        { id: 'rule1', meta: {}, options: [] },
        { id: 'rule2', meta: {}, options: [] },
        { id: 'rule1', meta: {}, options: ['option1'] },
      ]),
    ).toEqual({
      rule1: [
        { id: 'rule1', meta: {}, options: [] },
        { id: 'rule1', meta: {}, options: ['option1'] },
      ],
      rule2: [{ id: 'rule2', meta: {}, options: [] }],
    });
  });

  it('should return an empty object for an empty rules array', () => {
    expect(createRulesMap([])).toEqual({});
  });
});

describe('resolveGroupRefs', () => {
  const rulesMap = {
    rule1: [{ id: 'rule1', meta: {}, options: [] }],
    rule2: [{ id: 'rule2', meta: {}, options: [] }],
    rule3: [
      { id: 'rule3', meta: {}, options: [] },
      { id: 'rule3', meta: {}, options: ['option1'] },
    ],
  };

  it('should resolve refs for exact matches', () => {
    expect(resolveGroupRefs({ rule1: 1, rule2: 2 }, rulesMap)).toEqual({
      refs: [
        { slug: 'rule1', weight: 1 },
        { slug: 'rule2', weight: 2 },
      ],
      invalidRules: [],
    });
  });

  it('should resolve refs for wildcard matches', () => {
    expect(resolveGroupRefs({ 'rule*': 1 }, rulesMap)).toEqual({
      refs: [
        { slug: 'rule1', weight: 1 },
        { slug: 'rule2', weight: 1 },
        { slug: 'rule3', weight: 0.5 },
        { slug: 'rule3-9a11e3400eca832a', weight: 0.5 },
      ],
      invalidRules: [],
    });
  });

  it('should return invalid rules when no matches are found', () => {
    expect(resolveGroupRefs({ 'non-existent': 1 }, rulesMap)).toEqual({
      refs: [],
      invalidRules: ['non-existent'],
    });
  });

  it('should handle mixed valid and invalid rules', () => {
    expect(resolveGroupRefs({ rule1: 1, 'non-existent': 2 }, rulesMap)).toEqual(
      {
        refs: [{ slug: 'rule1', weight: 1 }],
        invalidRules: ['non-existent'],
      },
    );
  });

  it('should return empty refs and invalid for empty groupRules', () => {
    expect(resolveGroupRefs({}, rulesMap)).toEqual({
      refs: [],
      invalidRules: [],
    });
  });
});
