// eslint-disable-next-line n/no-sync
import { execSync } from 'node:child_process';
import { afterEach, expect, vi } from 'vitest';
import { executorContext } from '@code-pushup/test-nx-utils';
import runAutorunExecutor from './executor';
import * as utils from './utils';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    // eslint-disable-next-line n/no-sync
    execSync: vi.fn(),
  };
});

describe('runAutorunExecutor', () => {
  const parseAutorunExecutorOptionsSpy = vi.spyOn(
    utils,
    'parseAutorunExecutorOptions',
  );
  afterEach(() => {
    parseAutorunExecutorOptionsSpy.mockReset();
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
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line n/no-sync
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('utils'), {});
  });
});
