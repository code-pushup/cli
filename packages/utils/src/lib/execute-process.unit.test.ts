import { describe, expect, it, vi } from 'vitest';
import { getAsyncProcessRunnerConfig, mockProcessConfig } from '../../test';
import { executeProcess } from './execute-process';

describe('executeProcess', () => {
  it('should work with node command `node -v`', async () => {
    const cfg = mockProcessConfig({ command: `node`, args: ['-v'] });
    const processResult = await executeProcess(cfg);
    expect(processResult.stdout).toMatch(/v[0-9]{1,2}(\.[0-9]{1,2}){0,2}/);
  });

  it('should work with npx command `npx --help`', async () => {
    const cfg = mockProcessConfig({ command: `npx`, args: ['--help'] });
    const { observer } = cfg;
    const processResult = await executeProcess(cfg);
    expect(observer?.onStdout).toHaveBeenCalledTimes(1);
    expect(observer?.onComplete).toHaveBeenCalledTimes(1);
    expect(processResult.stdout).toContain('npm exec');
  });

  it('should work with script `node custom-script.js`', async () => {
    const cfg = mockProcessConfig(
      getAsyncProcessRunnerConfig({ interval: 10 }),
    );
    const { observer } = cfg;
    const errorSpy = vi.fn();
    const processResult = await executeProcess(cfg).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(processResult.stdout).toContain('process:complete');
    expect(observer?.onStdout).toHaveBeenCalledTimes(6);
    expect(observer?.onError).toHaveBeenCalledTimes(0);
    expect(observer?.onComplete).toHaveBeenCalledTimes(1);
  });

  it('should work with async script `node custom-script.js --arg` that throws an error', async () => {
    const cfg = mockProcessConfig(
      getAsyncProcessRunnerConfig({ interval: 10, runs: 1, throwError: true }),
    );
    const { observer } = cfg;
    const errorSpy = vi.fn();
    const processResult = await executeProcess(cfg).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(processResult).toBeUndefined();
    expect(observer?.onComplete).toHaveBeenCalledTimes(0);
    expect(observer?.onStdout).toHaveBeenCalledTimes(2);
    expect(observer?.onError).toHaveBeenCalledTimes(1);
  });
});
