import { expect } from 'vitest';
import { createExecutorTarget } from './executor-target.js';

describe('createExecutorTarget', () => {
  it('should return executor target without project name', () => {
    const result = createExecutorTarget();
    expect(result.executor).toBe('@code-pushup/nx-plugin:cli');
    expect(result.outputs).toEqual(['{options.persist.outputDir}/report.*']);
    expect(result.options).toBeDefined();
  });

  it('should use bin if provides', () => {
    const result = createExecutorTarget({ pluginBin: 'xyz' });
    expect(result.executor).toBe('xyz:cli');
    expect(result.outputs).toEqual(['{options.persist.outputDir}/report.*']);
    expect(result.options).toBeDefined();
  });

  it('should use projectPrefix if provided', () => {
    const result = createExecutorTarget({ projectPrefix: 'cli' });
    expect(result.executor).toBe('@code-pushup/nx-plugin:cli');
    expect(result.outputs).toEqual(['{options.persist.outputDir}/report.*']);
    expect(result.options?.projectPrefix).toBe('cli');
  });
});
