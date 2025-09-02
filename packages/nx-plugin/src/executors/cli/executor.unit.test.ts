import { logger } from '@nx/devkit';
import { afterAll, afterEach, beforeEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import * as executeProcessModule from '../../internal/execute-process.js';
import runAutorunExecutor from './executor.js';

describe('runAutorunExecutor', () => {
  const processEnvCP = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
  );
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');

  /* eslint-disable functional/immutable-data, @typescript-eslint/no-dynamic-delete */
  beforeAll(() => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => delete process.env[k]);
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    executeProcessSpy.mockResolvedValue({
      code: 0,
      stdout: '',
      stderr: '',
      date: new Date().toISOString(),
      duration: 100,
    });
  });

  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) => (process.env[k] = v));
  });
  /* eslint-enable functional/immutable-data, @typescript-eslint/no-dynamic-delete */

  it('should call executeProcess with return result', async () => {
    const output = await runAutorunExecutor({}, executorContext('utils'));
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @code-pushup/cli');
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npx',
        args: expect.arrayContaining(['@code-pushup/cli']),
        cwd: MEMFS_VOLUME,
        observer: expect.objectContaining({
          onError: expect.any(Function),
          onStdout: expect.any(Function),
        }),
      }),
    );
  });

  it('should normalize context', async () => {
    const output = await runAutorunExecutor(
      {},
      {
        ...executorContext('utils'),
        cwd: 'cwd-form-context',
      },
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('utils');
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@code-pushup/cli']),
      cwd: 'cwd-form-context',
      observer: {
        onError: expect.any(Function),
        onStdout: expect.any(Function),
      },
    });
  });

  it('should process executorOptions', async () => {
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT' } },
      executorContext('testing-utils'),
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('--persist.filename="REPORT"');
  });

  it('should create command from context and options if no api key is set', async () => {
    vi.stubEnv('CP_PROJECT', 'CLI');
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      executorContext('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
  });

  it('should create command from context, options and arguments if api key is set', async () => {
    vi.stubEnv('CP_API_KEY', 'cp_1234567');
    vi.stubEnv('CP_PROJECT', 'CLI');
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      executorContext('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
    expect(output.command).toMatch('--upload.apiKey="cp_1234567"');
    expect(output.command).toMatch('--upload.project="CLI"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      { ...executorContext('github-action'), cwd: '<CWD>' },
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);

    expect(output.command).toMatch('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Run CLI executor`),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command: npx @code-pushup/cli'),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runAutorunExecutor({ dryRun: true }, executorContext('utils'));

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DryRun execution of: npx @code-pushup/cli --dryRun',
      ),
    );
  });
});
