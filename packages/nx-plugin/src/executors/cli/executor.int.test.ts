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
      bin: 'npx ...',
      code: 0,
      signal: null,
      stdout: '',
      stderr: '',
    });
  });

  afterEach(() => {
    parseAutorunExecutorOptionsSpy.mockRestore();
    executeProcessSpy.mockReset();
  });

  it('should normalize context, parse CLI options and execute command', async () => {
    expect(process.env).not.toHaveProperty('CP_VERBOSE', 'true');
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
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@code-pushup/cli']),
      cwd: process.cwd(),
    });
  });

  it('should forward env options to executeProcess', async () => {
    const output = await runAutorunExecutor(
      {
        verbose: true,
        env: { TEST_VALUE: '42' },
      },
      executorContext('utils'),
    );
    expect(output.success).toBe(true);
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({
          TEST_VALUE: '42',
        }),
      }),
    );
  });
});
