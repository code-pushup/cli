import { describe, expect, it, vi } from 'vitest';
import {
  getNormalizedOptionValue,
  setVerboseMiddleware,
} from './set-verbose.middleware.js';

describe('setVerboseMiddleware', () => {
  it.each([
    [true, true],
    ['true', true],
    ['True', true],
    ['TRUE', true],
    [false, false],
    ['false', false],
    ['False', false],
    ['FALSE', false],
    [undefined, undefined],
    ['undefined', undefined],
    ['Whatever else', undefined],
    [0, undefined],
    [1, undefined],
    [null, undefined],
  ])(
    'should return normalize value of `%j` option set as `%j`',
    (value, expected) => {
      expect(getNormalizedOptionValue(value)).toBe(expected);
    },
  );

  it.each([
    [true, undefined, true],
    [false, undefined, false],
    [undefined, undefined, false],
    [undefined, true, true],
    [true, true, true],
    [false, true, true],
    [true, false, false],
    [false, false, false],
  ])(
    'should set verbosity based on env variable `%j` and cli argument `%j` to perform verbose effect as `%j`',
    (envValue, cliFlag, expected) => {
      vi.stubEnv('CP_VERBOSE', `${envValue}`);

      expect(setVerboseMiddleware({ verbose: cliFlag } as any).verbose).toBe(
        expected,
      );
    },
  );
});
