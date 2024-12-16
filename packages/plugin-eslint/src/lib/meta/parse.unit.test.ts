import type { Linter } from 'eslint';
import {
  isRuleOff,
  optionsFromRuleEntry,
  parseRuleId,
  resolveRuleOptions,
} from './parse.js';

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

describe('isRuleOff', () => {
  type TestCase = { entry: Linter.RuleEntry; expected: boolean };

  it.each<TestCase>([
    { entry: 'off', expected: true },
    { entry: 'warn', expected: false },
    { entry: 'error', expected: false },
  ])(
    'should return $expected for string severity $entry',
    ({ entry, expected }) => {
      expect(isRuleOff(entry)).toBe(expected);
    },
  );

  it.each<TestCase>([
    { entry: 0, expected: true },
    { entry: 1, expected: false },
    { entry: 2, expected: false },
  ])(
    'should return $expected for numeric severity $entry',
    ({ entry, expected }) => {
      expect(isRuleOff(entry)).toBe(expected);
    },
  );

  it.each<TestCase>([
    { entry: [0], expected: true },
    { entry: ['off'], expected: true },
    { entry: ['warn', { max: 10 }], expected: false },
    { entry: [2, { ignore: /^_/ }], expected: false },
  ])(
    'should return $expected for array entry $entry',
    ({ entry, expected }) => {
      expect(isRuleOff(entry)).toBe(expected);
    },
  );
});

describe('optionsFromRuleEntry', () => {
  it('should return options from array entry', () => {
    expect(optionsFromRuleEntry(['warn', { max: 10 }])).toEqual([{ max: 10 }]);
  });

  it('should return empty options for non-array entry', () => {
    expect(optionsFromRuleEntry('error')).toEqual([]);
  });

  it('should return empty options for array entry with severity only', () => {
    expect(optionsFromRuleEntry(['warn'])).toEqual([]);
  });
});

describe('resolveRuleOptions', () => {
  it('should prioritize custom options', () => {
    expect(
      resolveRuleOptions({
        id: 'arrow-body-style',
        options: ['always'],
        meta: { defaultOptions: ['as-needed'] },
      }),
    ).toEqual(['always']);
  });

  it('should fallback to default options if no custom options', () => {
    expect(
      resolveRuleOptions({
        id: 'arrow-body-style',
        options: [],
        meta: { defaultOptions: ['as-needed'] },
      }),
    ).toEqual(['as-needed']);
  });

  it('should return undefined if neither custom not default options are set', () => {
    expect(
      resolveRuleOptions({ id: 'require-await', options: [], meta: {} }),
    ).toBeUndefined();
  });
});
