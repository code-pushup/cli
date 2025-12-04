import type { ArgumentsCamelCase } from 'yargs';
import { logger } from '@code-pushup/utils';
import { logIntroMiddleware } from './log-intro.middleware';

describe('logIntroMiddleware', () => {
  it('should print logo, name and version', () => {
    logIntroMiddleware({ $0: 'code-pushup', _: ['collect'] });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringMatching(/<✓> Code PushUp CLI v\d+\.\d+\.\d+/),
    );
  });

  it('should not change arguments', () => {
    const args: ArgumentsCamelCase = { $0: 'code-pushup', _: ['collect'] };
    expect(logIntroMiddleware(args)).toBe(args);
  });
});
