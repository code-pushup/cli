import { afterEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import * as executeProcessModule from '../../internal/execute-process.js';
import runCliExecutor from './executor.js';

describe('runAutorunExecutor', () => {
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');

  beforeEach(() => {
    executeProcessSpy.mockResolvedValue({
      code: 0,
      stdout: '',
      stderr: '',
      date: new Date().toISOString(),
      duration: 100,
    });
  });

  afterEach(() => {
    executeProcessSpy.mockReset();
  });

  it('should execute command with proper arguments', async () => {
    const output = await runCliExecutor(
      { verbose: true },
      executorContext('utils'),
    );
    expect(output.success).toBe(true);

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@code-pushup/cli', '--verbose']),
      cwd: process.cwd(),
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });
});
