import { expect } from 'vitest';
import { createExecutorTarget } from './executor-target';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toStrictEqual({
      executor: '@code-pushup/nx-plugin:command',
    });
  });

  it('should use bin if provides', () => {
    expect(createExecutorTarget({ bin: 'xyz' })).toStrictEqual({
      executor: 'xyz:command',
    });
  });
});
