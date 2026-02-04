import { logger } from '@code-pushup/utils';
import { setVerboseMiddleware } from './set-verbose.middleware.js';

describe('setVerboseMiddleware', () => {
  it.each([
    [true, undefined, true],
    [false, undefined, false],
    [undefined, undefined, false],
    [undefined, true, true],
    [undefined, false, false],
    [true, true, true],
    [false, true, true],
    [true, false, false],
    [false, false, false],
  ])(
    'should set verbosity based on env variable `%j` and cli argument `%j` to perform verbose effect as `%j`',
    (envValue, cliFlag, expected) => {
      logger.setVerbose(envValue ?? false);

      expect(setVerboseMiddleware({ verbose: cliFlag } as any).verbose).toBe(
        expected,
      );
      expect(process.env['CP_VERBOSE']).toBe(`${expected}`);
      expect(logger.isVerbose()).toBe(expected);
    },
  );
});
