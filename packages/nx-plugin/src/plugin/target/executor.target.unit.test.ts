import { expect } from 'vitest';
import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    expect(createExecutorTarget()).toEqual(
      expect.objectContaining({
        executor: '@code-pushup/nx-plugin:cli',
      }),
    );
  });

  it('should use pluginBin if provides', () => {
    expect(createExecutorTarget({ pluginBin: 'xyz' })).toEqual(
      expect.objectContaining({
        executor: 'xyz:cli',
      }),
    );
  });
});
