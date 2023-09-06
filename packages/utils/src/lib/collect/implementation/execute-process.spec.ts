import { executeProcess } from './execute-process';
import {
  getAsyncProcessRunnerConfig,
  mockProcessConfig,
} from './process-helper.mock';
import { vol } from 'memfs';
import { join } from 'path';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});

const outFolder = '/output';
const outName = 'out-async-runner.json';
const outputPath = join(outFolder, outName);

describe('executeProcess', () => {
  beforeAll(() => {
    vol.fromJSON({ [outName]: '' }, outFolder);
  });

  it('should work with shell command `ls`', async () => {
    const cfg = mockProcessConfig({ command: `ls`, args: ['-a'] });
    const { observer } = cfg;
    const processResult = await executeProcess(cfg);
    expect(observer?.next).toHaveBeenCalledTimes(1);
    expect(observer?.complete).toHaveBeenCalledTimes(1);
    expect(processResult.stdout).toContain('..'); // `..` is only listed if the args work
  });

  it('should work with npx command `node -v`', async () => {
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

  it('should work with npx command `node custom-script.js`', async () => {
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
    expect(observer?.next).toHaveBeenCalledTimes(2); // 1 for next + 1 for the error in the sterr.on and 1 for on 'error'
    expect(observer?.error).toHaveBeenCalledTimes(1);
  });
});
