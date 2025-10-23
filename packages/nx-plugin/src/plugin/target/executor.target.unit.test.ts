import { describe, expect, it } from 'vitest';
import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
    });
  });

  it('should use bin if provides', () => {
    expect(
      createExecutorTarget({ bin: 'packages/cli/src/index.ts' }),
    ).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
      options: {
        bin: 'packages/cli/src/index.ts',
      },
    });
  });

  it('should use projectPrefix if provided', () => {
    expect(createExecutorTarget({ projectPrefix: 'cli' })).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
      options: {
        projectPrefix: 'cli',
      },
    });
  });
});
