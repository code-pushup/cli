// eslint-disable-next-line n/no-sync
import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { afterAll, expect, vi } from 'vitest';
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

const context = (nameOrOpt: string | { projectName: string } = 'my-lib') => {
  const { projectName } =
    typeof nameOrOpt === 'string' ? { projectName: nameOrOpt } : nameOrOpt;
  return {
    projectName,
    root: '.', // workspaceRoot
    projectsConfigurations: {
      projects: {
        [projectName]: {
          name: projectName,
          root: `libs/${projectName}`,
        },
      },
    },
  } as unknown as ExecutorContext;
};

describe('runAutorunExecutor', () => {
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');
  afterAll(() => {
    loggerInfoSpy.mockRestore();
    loggerWarnSpy.mockRestore();
  });
  it('should call execSync with autorun command and return result', async () => {
    const output = await runAutorunExecutor({}, context());
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
        ...context('utils'),
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
      context(),
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('--persist.filename="REPORT"');
  });

  it('should create command from context, options and arguments', async () => {
    const output = await runAutorunExecutor(
      { persist: { filename: 'REPORT', format: ['md', 'json'] } },
      context('core'),
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch('--persist.format="md,json"');
    expect(output.command).toMatch('--upload.project="cli"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runAutorunExecutor(
      { verbose: true },
      { ...context(), cwd: '<CWD>' },
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
    await runAutorunExecutor({ dryRun: true }, context());
    // eslint-disable-next-line n/no-sync
    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DryRun execution of: npx @code-pushup/cli autorun --dryRun',
      ),
    );
  });
});
