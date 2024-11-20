import { parseRuleId } from './parse';

describe('parseRuleId', () => {
  it.each([
    {
      ruleId: 'prefer-const',
      name: 'prefer-const',
    },
    {
      ruleId: 'sonarjs/no-identical-functions',
      plugin: 'sonarjs',
      name: 'no-identical-functions',
    },
    {
      ruleId: '@typescript-eslint/no-non-null-assertion',
      plugin: '@typescript-eslint',
      name: 'no-non-null-assertion',
    },
    {
      ruleId: 'no-secrets/no-secrets',
      plugin: 'no-secrets',
      name: 'no-secrets',
    },
    {
      ruleId: '@angular-eslint/template/no-negated-async',
      plugin: '@angular-eslint/template',
      name: 'no-negated-async',
    },
  ])('$ruleId => name: $name, plugin: $plugin', ({ ruleId, name, plugin }) => {
    expect(parseRuleId(ruleId)).toEqual({ name, plugin });
  });
});
