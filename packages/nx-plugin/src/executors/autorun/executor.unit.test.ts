import { logger } from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { afterEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-utils';
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
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');

  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
  });

  it('should call execSync with autorun command and return result', async () => {
    const output = await runAutorunExecutor({}, executorContext());
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @code-pushup/cli autorun');
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx @code-pushup/cli autorun'),
      {},
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
      executorContext(),
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('--persist.filename="REPORT"');
  });

  it('should create command from context, options and arguments', async () => {
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      executorContext('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch('--persist.format="md,json"');
    expect(output.command).toMatch('--upload.project="cli"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      { ...executorContext(), cwd: '<CWD>' },
    );
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(1);

    expect(output.command).toMatch('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(4);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Run autorun executor'),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringMatching(/CLI options: {[^}]*"verbose":true/),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command: npx @code-pushup/cli autorun'),
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `Options: ${JSON.stringify({ cwd: '<CWD>' }, null, 2)}`,
      ),
    );
  });

  it('should log command if dryRun is set', async () => {
    await runAutorunExecutor({ dryRun: true }, executorContext());

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DryRun execution of: npx @code-pushup/cli autorun --dryRun',
      ),
    );
  });
});
