import { join } from 'path';
import { vi } from 'vitest';
import { ProcessConfig } from '../src';

const asyncProcessPath = join(__dirname, './fixtures/execute-process.mock.mjs');

/**
 * Helps to get an async process runner config for testing.
 *
 * @param cfg
 */
export function getAsyncProcessRunnerConfig(
  cfg: Partial<ProcessConfig> & {
    throwError?: boolean;
    interval?: number;
    runs?: number;
    outputFile?: string;
  } = { throwError: false },
) {
  const outputFile = cfg?.outputFile || './tmp/out-async-runner.json';
  const args = [
    asyncProcessPath,
    cfg?.interval ? cfg.interval + '' : '10',
    cfg?.runs ? cfg.runs + '' : '4',
    cfg?.throwError ? '1' : '0',
    outputFile,
  ];
  return { command: 'node', args, outputFile };
}

export function mockProcessConfig(
  processConfig: Partial<ProcessConfig>,
): ProcessConfig {
  return {
    ...{
      command: 'dummy-string',
      args: [],
      outputFile: join('tmp', 'out.json'),
    },
    ...processConfig,
    observer: spyObserver(),
  };
}

/**
 * Helps to set up spy observers for testing.
 */
export function spyObserver() {
  const onStdoutSpy = vi.fn();
  const errorSpy = vi.fn();
  const completeSpy = vi.fn();
  return {
    onStdout: onStdoutSpy,
    error: errorSpy,
    complete: completeSpy,
  };
}
