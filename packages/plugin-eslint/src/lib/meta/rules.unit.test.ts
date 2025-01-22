import { expandWildcardRules } from './rules.js';

describe('expandWildcardRules', () => {
  const rules = [
    'no-var',
    'no-const-assign',
    'no-debugger',
    'react/jsx-key',
    'react/react-in-jsx-scope',
    'react/no-deprecated',
    '@typescript-eslint/no-array-constructor',
  ];

  it('should expand wildcard rules correctly', () => {
    expect(expandWildcardRules('react/*', rules)).toEqual([
      'react/jsx-key',
      'react/react-in-jsx-scope',
      'react/no-deprecated',
    ]);
  });

  it('should return an empty array when no rules match the wildcard', () => {
    expect(expandWildcardRules('non-existent/*', rules)).toEqual([]);
  });

  it('should handle wildcards matching a single rule', () => {
    expect(expandWildcardRules('no-var*', rules)).toEqual(['no-var']);
  });

  it('should return an empty array when the rules are empty', () => {
    expect(expandWildcardRules('react/*', [])).toEqual([]);
  });

  it('should return all rules when a wildcard has no valid prefix', () => {
    expect(expandWildcardRules('*', rules)).toEqual(rules);
  });

  it('should handle a wildcard with a single-character prefix', () => {
    expect(expandWildcardRules('n*', rules)).toEqual([
      'no-var',
      'no-const-assign',
      'no-debugger',
    ]);
  });
});
