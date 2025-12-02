import { afterEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
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
    parseAutorunExecutorOptionsSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should normalize context, parse CLI options and execute command', async () => {
    const { success, command } = await runAutorunExecutor(
      { verbose: true },
      executorContext('utils'),
    );
    expect(success).toBe(true);
    const cleanCommand = removeColorCodes(command || '');
    expect(cleanCommand).toMatch('npx @code-pushup/cli');
    expect(cleanCommand).toMatch('CP_VERBOSE="true"');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npx',
        args: expect.arrayContaining(['@code-pushup/cli']),
        cwd: expect.any(String),
        env: expect.objectContaining({
          CP_VERBOSE: 'true',
        }),
      }),
    );
  });
});
