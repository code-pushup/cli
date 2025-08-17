import { expect, vi } from 'vitest';
import { createExecutionObserver } from './create-execution-observer.js';

describe('createExecutionObserver', () => {
  it('should create execution observer with default settings', () => {
    expect(createExecutionObserver()).toStrictEqual({
      onStderr: expect.any(Function),
      onStdout: expect.any(Function),
    });
  });

  it('should create execution observer with silent false settings', () => {
    expect(createExecutionObserver({ silent: false })).toStrictEqual({
      onStderr: expect.any(Function),
      onStdout: expect.any(Function),
    });
  });

  it('should create execution observer with default silent taking priority over CP_VERBOSE flag', () => {
    vi.stubEnv('CP_VERBOSE', 'false');

    expect(createExecutionObserver()).toStrictEqual({
      onStderr: expect.any(Function),
      onStdout: expect.any(Function),
    });
  });

  it('should create execution observer with silent setting', () => {
    expect(createExecutionObserver({ silent: true })).toStrictEqual({
      onStderr: expect.any(Function),
    });
  });
});
