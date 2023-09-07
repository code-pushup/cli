import { describe, it, expect, vi } from 'vitest';
import { executeProcess } from './execute-process';
import {
  getAsyncProcessRunnerConfig,
  mockProcessConfig,
} from './mock/process-helper.mock';
import { join } from 'path';
import * as os from 'os';

const outFolder = '';
const outName = 'out-async-runner.json';
const outputPath = join(outFolder, outName);

describe('executeProcess', () => {
  if (os.platform() !== 'win32') {
    it('should work with shell command `ls`', async () => {
      const cfg = mockProcessConfig({ command: `ls`, args: ['-a'] });
      const { observer } = cfg;
      const processResult = await executeProcess(cfg);
      expect(observer?.next).toHaveBeenCalledTimes(1);
      expect(observer?.complete).toHaveBeenCalledTimes(1);
      expect(processResult.stdout).toContain('..');
    });
  }

  it('should work with node command `node -v`', async () => {
    const cfg = mockProcessConfig({ command: `node`, args: ['-v'] });
    const processResult = await executeProcess(cfg);
    expect(processResult.stdout).toContain('v');
  });

  it('should work with npx command `npx --help`', async () => {
    const cfg = mockProcessConfig({ command: `npx`, args: ['--help'] });
    const { observer } = cfg;
    const processResult = await executeProcess(cfg);
    expect(observer?.next).toHaveBeenCalledTimes(1);
    expect(observer?.complete).toHaveBeenCalledTimes(1);
    expect(processResult.stdout).toContain('Options');
  });

  it('should work with script `node custom-script.js`', async () => {
    const cfg = mockProcessConfig(
      getAsyncProcessRunnerConfig({ interval: 10, outputPath }),
    );
    const { observer } = cfg;
    const errorSpy = vi.fn();
    const processResult = await executeProcess(cfg).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(processResult.stdout).toContain('process:complete');
    expect(observer?.next).toHaveBeenCalledTimes(6);
    expect(observer?.error).toHaveBeenCalledTimes(0);
    expect(observer?.complete).toHaveBeenCalledTimes(1);
  });

  it('should work with async script `node custom-script.js` that throws', async () => {
    const cfg = mockProcessConfig(
      getAsyncProcessRunnerConfig({ interval: 10, runs: 1, throwError: true }),
    );
    const { observer } = cfg;
    const errorSpy = vi.fn();
    const processResult = await executeProcess(cfg).catch(errorSpy);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(processResult).toBe(undefined);
    expect(observer?.complete).toHaveBeenCalledTimes(0);
    expect(observer?.next).toHaveBeenCalledTimes(2);
    expect(observer?.error).toHaveBeenCalledTimes(1);
  });
});
