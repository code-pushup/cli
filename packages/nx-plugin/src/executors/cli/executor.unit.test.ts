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

  beforeAll(() => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => Reflect.deleteProperty(process.env, k));
  });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) =>
      Reflect.set(process.env, k, v),
    );
  });

  beforeEach(() => {
    vi.unstubAllEnvs();
    executeProcessSpy.mockResolvedValue({
      bin: 'npx ...',
      code: 0,
      signal: null,
      stdout: '',
      stderr: '',
    });
  });

  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should call executeProcess with return result', async () => {
    const output = await runAutorunExecutor({}, executorContext('utils'));
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @code-pushup/cli');
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'npx',
      args: expect.arrayContaining(['@code-pushup/cli']),
      cwd: MEMFS_VOLUME,
    });
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
    });
  });

  it('should process executorOptions', async () => {
    const output = await runAutorunExecutor(
      { output: 'code-pushup.config.json', persist: { filename: 'REPORT' } },
      executorContext('testing-utils'),
    );
    expect(output.success).toBe(true);
    expect(output.command).toContain('--output="code-pushup.config.json"');
    expect(output.command).toContain('--persist.filename="REPORT"');
  });

  it('should create command from context and options if no api key is set', async () => {
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
    const output = await runAutorunExecutor(
      {
        persist: { filename: 'REPORT', format: ['md', 'json'] },
        upload: { project: 'CLI' },
      },
      executorContext('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
    expect(output.command).toMatch('--upload.apiKey="cp_1234567"');
    expect(output.command).toMatch('--upload.project="CLI"');
  });

  it('should set env var information if verbose is set', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      { ...executorContext('github-action'), cwd: '<CWD>' },
    );
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);

    expect(output.command).not.toContain('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('CP_VERBOSE=true'),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runAutorunExecutor({ dryRun: true }, executorContext('utils'));

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('DryRun execution of'),
    );
  });
});
