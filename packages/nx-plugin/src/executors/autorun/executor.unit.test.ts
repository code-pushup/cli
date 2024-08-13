import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import runAutorunExecutor from './executor';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');

  return {
    ...actual,
    // eslint-disable-next-line n/no-sync
    execSync: vi.fn((command: string) => {
      if (command.includes('THROW_ERROR')) {
        throw new Error(command);
      }
    }),
  };
});

describe('runAutorunExecutor', () => {
  const envSpy = vi.spyOn(process, 'env', 'get');
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');

  beforeEach(() => {
    envSpy.mockReturnValue({});
  });
  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
    envSpy.mockReset().mockReturnValue({});
  });

  it('should call execSync with autorun command and return result', async () => {
    const output = await runAutorunExecutor({}, executorContext('utils'));
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @code-pushup/cli autorun');
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx @code-pushup/cli autorun'),
      { cwd: '/test' },
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
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('utils'), {
      cwd: 'cwd-form-context',
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

  it('should create command from context, options and arguments', async () => {
    envSpy.mockReturnValue({ CP_PROJECT: 'CLI' });
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      executorContext('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch(
      '--persist.format="md" --persist.format="json"',
    );
    expect(output.command).toMatch('--upload.project="CLI"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      { ...executorContext('github-action'), cwd: '<CWD>' },
    );
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(1);

    expect(output.command).toMatch('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Run autorun executor'),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command: npx @code-pushup/cli autorun'),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runAutorunExecutor({ dryRun: true }, executorContext('utils'));

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DryRun execution of: npx @code-pushup/cli autorun --dryRun',
      ),
    );
  });
});
