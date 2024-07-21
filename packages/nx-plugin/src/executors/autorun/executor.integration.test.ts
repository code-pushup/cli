// eslint-disable-next-line n/no-sync
import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'node:child_process';
import { beforeEach, expect, vi } from 'vitest';
import runAutorunExecutor from './executor';
import { parseAutorunExecutorOptions } from './utils';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');

  return {
    ...actual,
    // eslint-disable-next-line n/no-sync
    execSync: vi.fn(),
  };
});

vi.mock('./utils', async () => {
  const actual: any = await vi.importActual('./utils');

  return {
    ...actual,
    parseAutorunExecutorOptions: vi.fn(actual.parseAutorunExecutorOptions),
  };
});

const projectName = 'my-lib';
const context = {
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

describe('runAutorunExecutor', () => {
  const loggerWarnSpy = vi.spyOn(logger, 'warn');
  beforeEach(() => {
    loggerWarnSpy.mockReturnValue();
  });

  it('should normalize context, parse CLI options and execute command', async () => {
    const output = await runAutorunExecutor({ verbose: true }, context);
    expect(output.success).toBe(true);
    // eslint-disable-next-line n/no-sync
    expect(parseAutorunExecutorOptions).toHaveBeenCalledTimes(1);

    //is context normalized?
    expect(parseAutorunExecutorOptions).toHaveBeenCalledWith(
      { verbose: true },
      expect.objectContaining({
        projectConfig: expect.objectContaining({ name: 'my-lib' }),
      }),
    );
    expect(execSync).toHaveBeenCalledTimes(1);
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(projectName),
      {},
    );
  });

  it('should consider given options', async () => {
    const cfg = {
      persist: { filename: 'filename-xyz' },
    };
    const output = await runAutorunExecutor(cfg, context);

    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('filename-xyz'),
      {},
    );

    expect(output.success).toBe(true);
    expect(output.command).toMatch(`filename-xyz`);
  });
});
