import { afterEach, beforeEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import runAutorunExecutor from './executor.js';
import * as utils from './utils.js';

const { executeProcessSpy } = vi.hoisted(() => ({
  executeProcessSpy: vi.fn().mockResolvedValue({
    code: 0,
    stdout: '',
    stderr: '',
    date: new Date().toISOString(),
    duration: 100,
  }),
}));

vi.mock('@code-pushup/utils', async () => {
  const utils = await vi.importActual('@code-pushup/utils');
  return {
    ...utils,
    executeProcess: executeProcessSpy,
  };
});

describe('runAutorunExecutor', () => {
  const parseAutorunExecutorOptionsSpy = vi.spyOn(
    utils,
    'parseAutorunExecutorOptions',
  );

  beforeEach(() => {
    executeProcessSpy.mockClear();
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
        cwd: expect.any(String),
      }),
    );
  });
});
