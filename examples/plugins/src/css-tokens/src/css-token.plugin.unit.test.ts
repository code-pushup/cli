import { describe, expect, it } from 'vitest';
import {
  invalidColors,
  invalidStyleInline,
  invalidStyleMulitLine,
  invalidStyleSingleLine,
  validStyleInline,
  validStylesMultiLine,
  validStylesSingleLine,
} from '../mocks/fixtures.mock';
import { retrieveNonVariableCssTokens } from './utils';

// nx unit-test examples-plugins --testNamePattern="retrieveNonVariableCssTokens"
// nx unit-test examples-plugins --testNamePattern="retrieveNonVariableCssTokens"
describe('retrieveNonVariableCssTokens', () => {
  it.each([validStylesSingleLine, validStylesMultiLine, validStyleInline])(
    'should return empty array for OK file (content: %s)',
    fileContent => {
      expect(retrieveNonVariableCssTokens(fileContent)).toEqual([]);
    },
  );

  it.each([
    ...invalidColors.map(color => invalidStyleSingleLine(color)),
    ...invalidColors.map(color => invalidStyleMulitLine(color)),
    ...invalidColors.map(color => invalidStyleInline(color)),
  ])(
    'should return array of colors for file (content: %s)',
    ({ fileContent, rule }) => {
      expect(retrieveNonVariableCssTokens(fileContent)).toEqual([
        rule?.substring('color: '.length, rule.length - 1) ?? rule,
      ]);
    },
  );
});
