import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as utils from '@code-pushup/utils';
import type { ProcessResult } from '@code-pushup/utils';
import { deriveYarnVersion } from './derive-yarn.js';

describe('deriveYarnVersion', () => {
  const executeProcessSpy = vi.spyOn(utils, 'executeProcess');

  beforeEach(() => {
    executeProcessSpy.mockClear();
  });

  afterAll(() => {
    executeProcessSpy.mockRestore();
  });

  it('should return yarn-classic if and yarn v1 is installed', async () => {
    executeProcessSpy.mockResolvedValue({ stdout: '1.22.2' } as ProcessResult);

    await expect(deriveYarnVersion()).resolves.toBe('yarn-classic');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'yarn',
      args: ['-v'],
      verbose: false,
    });
  });

  it('should return yarn-modern if yarn greater than v1 is installed', async () => {
    executeProcessSpy.mockResolvedValue({ stdout: '2.22.2' } as ProcessResult);

    await expect(deriveYarnVersion()).resolves.toBe('yarn-modern');
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'yarn',
      args: ['-v'],
      verbose: false,
    });
  });

  it('should return false if yarn is NOT installed', async () => {
    executeProcessSpy.mockResolvedValue({
      stdout: 'not-installed',
    } as ProcessResult);

    await expect(deriveYarnVersion()).resolves.toBe(false);
    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      command: 'yarn',
      args: ['-v'],
      verbose: false,
    });
  });
});
