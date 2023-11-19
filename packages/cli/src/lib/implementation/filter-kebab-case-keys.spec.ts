import { expect } from 'vitest';
import { filterKebabCaseKeys } from './filter-kebab-case-keys';

describe('filterKebabCaseKeys', () => {
  it('should filter kebab-case keys', () => {
    const obj = {
      'kebab-case': 'value',
      camelCase: 'value',
      snake_case: 'value',
    };
    const filtered = filterKebabCaseKeys(obj);
    expect(filtered).toEqual({
      camelCase: 'value',
      snake_case: 'value',
    });
  });
});
