import { describe, expect, it } from 'vitest';
import type { ActiveConfigRuleSetting } from './model.js';
import { getSeverityFromRuleConfig } from './utils.js';

describe('getSeverityFromRuleConfig', () => {
  it('should respect the default severity when from the default', () => {
    expect(getSeverityFromRuleConfig([true])).toBe('error');
  });

  it('should consider the default severity when its different from the default', () => {
    expect(getSeverityFromRuleConfig([true], 'warning')).toBe('warning');
  });

  it.each([true, 5, 'percentage', ['/\\[.+]/', 'percentage'], { a: 1 }])(
    'should return the default severity for a primary value %s',
    ruleConfig => {
      expect(
        getSeverityFromRuleConfig(ruleConfig as ActiveConfigRuleSetting),
      ).toBe('error');
    },
  );

  it('should return the default severity when the rule config does not have a secondary item', () => {
    expect(getSeverityFromRuleConfig([true])).toBe('error');
  });

  it('should return the default severity when the secondary item is missing the `severity` property', () => {
    expect(getSeverityFromRuleConfig([true, {}])).toBe('error');
  });

  it('should return the default severity when `severity` property is of type function', () => {
    expect(getSeverityFromRuleConfig([true, { severity: () => {} }])).toBe(
      'error',
    );
  });

  it.each([
    { ruleConfig: [true, { severity: 'warning' }], expected: 'warning' },
    { ruleConfig: [true, { severity: 'error' }], expected: 'error' },
  ])('should return the set severity `%s`', ({ ruleConfig, expected }) => {
    expect(getSeverityFromRuleConfig(ruleConfig)).toBe(expected);
  });

  it.each([null, undefined])(
    'should return the default severity for disabled rules %s',
    ruleConfig => {
      expect(
        getSeverityFromRuleConfig(
          ruleConfig as unknown as ActiveConfigRuleSetting,
        ),
      ).toBe('error');
    },
  );
});
