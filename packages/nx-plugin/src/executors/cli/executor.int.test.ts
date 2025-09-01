import { afterEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import * as executeProcessModule from '../../internal/execute-process.js';
import runAutorunExecutor from './executor.js';
import * as utils from './utils.js';

describe('runAutorunExecutor', () => {
  const parseAutorunExecutorOptionsSpy = vi.spyOn(
    utils,
    'parseAutorunExecutorOptions',
  );
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
    parseAutorunExecutorOptionsSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should normalize context, parse CLI options and execute command', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      executorContext('utils'),
    );
    expect(output.success).toBe(true);

    expect(parseAutorunExecutorOptionsSpy).toHaveBeenCalledTimes(1);

    //is context normalized
    expect(parseAutorunExecutorOptionsSpy).toHaveBeenCalledWith(
      { verbose: true },
      expect.objectContaining({
        projectConfig: expect.objectContaining({ name: 'utils' }),
      }),
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npx',
        args: expect.arrayContaining(['@code-pushup/cli']),
        cwd: process.cwd(),
        observer: expect.objectContaining({
          onError: expect.any(Function),
          onStdout: expect.any(Function),
        }),
      }),
    );
  });
});
