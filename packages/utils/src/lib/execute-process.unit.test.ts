import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { getAsyncProcessRunnerConfig, mockProcessConfig } from '../../test';
import { executeProcess, objectToCliArgs } from './execute-process';

const outFolder = '';
const outName = 'tmp/out-async-runner.json';
const outputFile = join(outFolder, outName);

describe('executeProcess', () => {
  it('should work with node command `node -v`', async () => {
    const cfg = mockProcessConfig({ command: `node`, args: ['-v'] });
    const processResult = await executeProcess(cfg);
    expect(processResult.stdout).toContain('v');
  });

  it('should work with npx command `npx --help`', async () => {
    const cfg = mockProcessConfig({ command: `npx`, args: ['--help'] });
    const { observer } = cfg;
    const processResult = await executeProcess(cfg);
    expect(observer?.onStdout).toHaveBeenCalledTimes(1);
    expect(observer?.onComplete).toHaveBeenCalledTimes(1);
    expect(processResult.stdout).toContain('Options');
  });

  it('should work with script `node custom-script.js`', async () => {
    const cfg = mockProcessConfig(
      getAsyncProcessRunnerConfig({ interval: 10, outputFile }),
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

describe('objectToCliArgs', () => {
  it('should handle the "_" argument as script', () => {
    const params = { _: 'bin.js' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js']);
  });

  it('should handle the "_" argument with multiple values', () => {
    const params = { _: ['bin.js', '--help'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js', '--help']);
  });

  it('should handle shorthands arguments', () => {
    const params = {
      e: `test`,
    };
    const result = objectToCliArgs(params);
    expect(result).toEqual([`-e="${params.e}"`]);
  });

  it('should handle string arguments', () => {
    const params = { name: 'Juanita' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--name="Juanita"']);
  });

  it('should handle number arguments', () => {
    const params = { parallel: 5 };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--parallel=5']);
  });

  it('should handle boolean arguments', () => {
    const params = { progress: true };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--progress']);
  });

  it('should handle negated boolean arguments', () => {
    const params = { progress: false };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--no-progress']);
  });

  it('should handle array of string arguments', () => {
    const params = { format: ['json', 'md'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--format="json"', '--format="md"']);
  });

  it('should throw error for unsupported type', () => {
    const params = { unsupported: undefined as any };
    expect(() => objectToCliArgs(params)).toThrow('Unsupported type');
  });
});
