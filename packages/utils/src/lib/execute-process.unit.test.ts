import { describe, expect, it, vi } from 'vitest';
import { getAsyncProcessRunnerConfig } from '@code-pushup/test-utils';
import { ProcessObserver, executeProcess } from './execute-process';

describe('executeProcess', () => {
  const spyObserver: ProcessObserver = {
    onStdout: vi.fn(),
    onError: vi.fn(),
    onComplete: vi.fn(),
  };
  const errorSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work with node command `node -v`', async () => {
    const processResult = await executeProcess({
      command: `node`,
      args: ['-v'],
      observer: spyObserver,
    });

    // Note: called once or twice depending on environment (2nd time for a new line)
    expect(spyObserver.onStdout).toHaveBeenCalled();
    expect(spyObserver.onComplete).toHaveBeenCalledTimes(1);
    expect(spyObserver.onError).toHaveBeenCalledTimes(0);
    expect(processResult.stdout).toMatch(/v\d{1,2}(\.\d{1,2}){0,2}/);
  });

  it('should work with npx command `npx --help`', async () => {
    const processResult = await executeProcess({
      command: `npx`,
      args: ['--help'],
      observer: spyObserver,
    });
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(1);
    expect(spyObserver.onComplete).toHaveBeenCalledTimes(1);
    expect(spyObserver.onError).toHaveBeenCalledTimes(0);
    expect(processResult.stdout).toContain('npm exec');
  });

  it('should work with script `node custom-script.js`', async () => {
    const processResult = await executeProcess({
      ...getAsyncProcessRunnerConfig({ interval: 10, runs: 4 }),
      observer: spyObserver,
    }).catch(errorSpy);

    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(processResult.stdout).toContain('process:complete');
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(6); // intro + 4 runs + complete
    expect(spyObserver.onError).toHaveBeenCalledTimes(0);
    expect(spyObserver.onComplete).toHaveBeenCalledTimes(1);
  });

  it('should work with async script `node custom-script.js` that throws an error', async () => {
    const processResult = await executeProcess({
      ...getAsyncProcessRunnerConfig({
        interval: 10,
        runs: 1,
        throwError: true,
      }),
      observer: spyObserver,
    }).catch(errorSpy);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(processResult).toBeUndefined();
    expect(spyObserver.onStdout).toHaveBeenCalledTimes(2); // intro + 1 run before error
    expect(spyObserver.onError).toHaveBeenCalledTimes(1);
    expect(spyObserver.onComplete).toHaveBeenCalledTimes(0);
  });
});
