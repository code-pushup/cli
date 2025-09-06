import { expect } from 'vitest';
import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target with default package name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@code-pushup/nx-plugin:cli',
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
