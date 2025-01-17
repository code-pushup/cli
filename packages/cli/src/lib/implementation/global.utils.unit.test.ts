import { describe, expect, it, vi } from 'vitest';
import { ui } from '@code-pushup/utils';
import { filterKebabCaseKeys, logErrorBeforeThrow } from './global.utils.js';
import { OptionValidationError } from './validate-filter-options.utils.js';

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

describe('logErrorBeforeThrow', () => {
  it('should exit when OptionValidationError is thrown', async () => {
    const errorFn = vi.fn().mockRejectedValue(new OptionValidationError());
    const logFn = logErrorBeforeThrow(errorFn);

    await expect(logFn()).rejects.toThrow(
      'process.exit unexpectedly called with "1"',
    );
    await expect(logFn()).rejects.not.toThrow(
      expect.any(OptionValidationError),
    );
  });

  it('should log a custom error when OptionValidationError is thrown', async () => {
    const errorFn = vi
      .fn()
      .mockRejectedValue(new OptionValidationError('Option validation failed'));

    try {
      await logErrorBeforeThrow(errorFn)();
    } catch {
      /* suppress */
    }
    expect(ui()).toHaveLoggedLevel('error');
    expect(ui()).toHaveLoggedMessage('Option validation failed');
  });

  it('should rethrow errors other than OptionValidationError', async () => {
    const errorFn = vi.fn().mockRejectedValue(new Error('Some other error'));
    await expect(logErrorBeforeThrow(errorFn)()).rejects.toThrow(
      'Some other error',
    );
  });
});
