import { afterAll, afterEach, beforeEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import { MEMFS_VOLUME, removeColorCodes } from '@code-pushup/test-utils';
import * as executeProcessModule from '../../internal/execute-process.js';
import runAutorunExecutor from './executor.js';

describe('runAutorunExecutor', () => {
  const processEnvCP = Object.fromEntries(
    Object.entries(process.env).filter(([k]) => k.startsWith('CP_')),
  );
  let loggerCommandSpy: any;
  let loggerWarnSpy: any;
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');

  beforeAll(async () => {
    Object.entries(process.env)
      .filter(([k]) => k.startsWith('CP_'))
      .forEach(([k]) => delete process.env[k]);

    const { logger } = await import('@code-pushup/utils');
    loggerCommandSpy = vi
      .spyOn(logger, 'command')
      .mockImplementation(async (bin, worker, options) => {
        // Execute worker immediately since executor doesn't await logger.command
        // We await it here to ensure executeProcess is called in tests
        await worker();
        return undefined;
      });
    loggerWarnSpy = vi.spyOn(logger, 'warn');
  });

  afterAll(() => {
    Object.entries(processEnvCP).forEach(([k, v]) => (process.env[k] = v));
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
    loggerCommandSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should call executeProcess with return result', async () => {
    const { success, command } = await runAutorunExecutor(
      {},
      executorContext('utils'),
    );

    expect(success).toBe(true);
    expect(removeColorCodes(command || '')).toMatch('npx @code-pushup/cli');
    // The executor now calls executeProcess directly
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npx',
        args: expect.arrayContaining(['@code-pushup/cli']),
        cwd: MEMFS_VOLUME,
        env: expect.any(Object),
      }),
    );
  });

  it('should get CWD from context', async () => {
    const output = await runAutorunExecutor(
      {},
      {
        ...executorContext('utils'),
        cwd: 'cwd-form-context',
      },
    );

    expect(output.success).toBe(true);
    const commandWithoutAnsi = removeColorCodes(output.command || '');
    expect(commandWithoutAnsi).toMatch('cwd-form-context');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: 'cwd-form-context',
      }),
    );
  });

  it('should get env variables from options', async () => {
    const { command } = await runAutorunExecutor(
      {
        env: {
          CP_API_KEY: '123456789',
          CP_PROJECT: 'cli',
        },
      },
      executorContext('utils'),
    );
    const commandWithoutAnsi = removeColorCodes(command || '');
    expect(commandWithoutAnsi).toMatch('CP_API_KEY="123456789"');
    expect(commandWithoutAnsi).toMatch('CP_PROJECT="cli"');
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({
          CP_API_KEY: '123456789',
          CP_PROJECT: 'cli',
        }),
      }),
    );
  });

  it('should process executorOptions', async () => {
    const output = await runAutorunExecutor(
      { output: 'code-pushup.config.json', persist: { filename: 'REPORT' } },
      executorContext('testing-utils'),
    );
    expect(output.success).toBe(true);
    const commandWithoutAnsi = removeColorCodes(output.command || '');
    expect(commandWithoutAnsi).toContain('--output="code-pushup.config.json"');
    expect(commandWithoutAnsi).toContain('--persist.filename="REPORT"');
  });

  it('should create command from context and options if no api key is set', async () => {
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      executorContext('core'),
    );
    const commandWithoutAnsi = removeColorCodes(output.command || '');
    expect(commandWithoutAnsi).toMatch('--persist.filename="REPORT"');
    expect(commandWithoutAnsi).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
  });

  it('should create command from context, options and arguments if api key is set', async () => {
    const output = await runAutorunExecutor(
      {
        persist: { filename: 'REPORT', format: ['md', 'json'] },
        upload: { apiKey: 'cp_1234567', project: 'CLI' },
      },
      executorContext('core'),
    );
    const commandWithoutAnsi = removeColorCodes(output.command || '');
    expect(commandWithoutAnsi).toMatch('--persist.filename="REPORT"');
    expect(commandWithoutAnsi).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
    expect(commandWithoutAnsi).toMatch('--upload.apiKey="cp_1234567"');
    expect(commandWithoutAnsi).toMatch('--upload.project="CLI"');
  });

  it('should log information and set CP_VERBOSE if verbose is set ', async () => {
    const { command } = await runAutorunExecutor(
      { verbose: true },
      { ...executorContext('github-action'), cwd: '<CWD>' },
    );

    expect(removeColorCodes(command || '')).toMatch('CP_VERBOSE="true"');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        env: expect.objectContaining({ CP_VERBOSE: 'true' }),
      }),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runAutorunExecutor({ dryRun: true }, executorContext('utils'));

    expect(loggerCommandSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    const warnCall = loggerWarnSpy.mock.calls[0]?.[0] as string | undefined;
    const warnMessage = removeColorCodes(warnCall || '');
    expect(warnMessage).toContain('DryRun execution of:');
    expect(warnMessage).toContain('npx @code-pushup/cli');
  });
});
