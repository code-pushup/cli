import { expect } from 'vitest';
import { createExecutorTarget } from './executor-target';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
  });

  it('should use bin if provides', () => {
    expect(createExecutorTarget({ bin: 'xyz' })).toStrictEqual({
      executor: 'xyz:autorun',
    });
  });

  it('should use projectPrefix if provided', () => {
    expect(createExecutorTarget({ projectPrefix: 'cli' })).toStrictEqual({
      executor: '@code-pushup/nx-plugin:autorun',
      options: {
        projectPrefix: 'cli',
      },
    });
  });
});
