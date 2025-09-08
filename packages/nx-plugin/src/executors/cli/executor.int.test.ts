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
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining([
        '@code-pushup/cli',
        '--verbose',
        '--no-progress',
      ]),
      cwd: process.cwd(),
      verbose: true,
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });

  it('should execute command with provided bin', async () => {
    const bin = 'packages/cli/dist';
    const output = await runAutorunExecutor(
      {
        verbose: true,
        bin,
      },
      executorContext('utils'),
    );
    expect(output.success).toBe(true);

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.arrayContaining([bin]),
      }),
    );
  });

  it('should execute command with provided env vars', async () => {
    const output = await runAutorunExecutor(
      {
        verbose: true,
        env: {
          NODE_OPTIONS: '--import tsx',
          TSX_TSCONFIG_PATH: 'tsconfig.base.json',
        },
      },
      executorContext('utils'),
    );
    expect(output.success).toBe(true);

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        env: {
          NODE_OPTIONS: '--import tsx',
          TSX_TSCONFIG_PATH: 'tsconfig.base.json',
        },
      }),
    );
  });
});
