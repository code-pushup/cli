import { expect } from 'vitest';
import { filterKebabCaseKeys } from './global.utils';

describe('filterKebabCaseKeys', () => {
  it('should filter root level kebab-case keys', () => {
    const obj = {
      'kebab-case': 'value',
      camelCase: 'value',
      snake_case: 'value',
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      camelCase: 'value',
      snake_case: 'value',
    });
  });

  it('should filter nested kebab-case keys', () => {
    const obj = {
      nested: {
        'nested-kebab-case': 'value',
        nestedCamelCase: 'value',
      },
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      nested: {
        nestedCamelCase: 'value',
      },
    });
  });

  it('should keep array values untouched', () => {
    const obj = {
      'kebab-case': [],
      camelCase: ['kebab-case', { 'kebab-case': 'value' }],
    };
    expect(filterKebabCaseKeys(obj)).toEqual({
      camelCase: ['kebab-case', { 'kebab-case': 'value' }],
    });
  });
});
