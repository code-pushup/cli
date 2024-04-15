// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { expect } from 'vitest';
import executor from './executor';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');

  return {
    ...actual,
    // eslint-disable-next-line n/no-sync
    execSync: vi.fn(),
  };
});

const projectName = 'my-lib';
const context = {
  projectName,
  root: '.', // workspaceRoot
  projectsConfigurations: {
    projects: {
      [projectName]: {
        root: `libs/${projectName}`,
      },
    },
  },
} as unknown as ExecutorContext;

describe('Autorun Executor', () => {
  it('should consider the context argument', async () => {
    const output = await executor({}, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`libs/${projectName}`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(`libs/${projectName}`),
      {},
    );
  });

  it('should process dryRun option', async () => {
    const output = await executor({ dryRun: true }, context);
    expect(output.success).toBe(true);
    expect(output.command).toMatch(`libs/${projectName}`);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(0);
  });
});
