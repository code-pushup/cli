import { describe, expect, it, vi } from 'vitest';
import { isVerbose } from '@code-pushup/utils';
import { setVerboseMiddleware } from './set-verbose.middleware.js';

describe('setVerboseMiddleware', () => {
  it.each([
    [true, undefined, true],
    [false, undefined, false],
    [undefined, undefined, false],
    [undefined, true, true],
    [true, true, true],
    [false, true, true],
    [true, false, false],
    [false, false, false],
    ['True', undefined, true],
    ['TRUE', undefined, true],
    [42, undefined, false],
    [undefined, 'true', true],
    [true, 'False', false],
  ])(
    'should set CP_VERBOSE based on env variable `%j` and cli argument `%j` and return `%j` from isVerbose() function',
    (envValue, cliFlag, expected) => {
      vi.stubEnv('CP_VERBOSE', `${envValue}`);

      setVerboseMiddleware({ verbose: cliFlag } as any);
      expect(process.env['CP_VERBOSE']).toBe(`${expected}`);
      expect(isVerbose()).toBe(expected);
    },
  );
});
