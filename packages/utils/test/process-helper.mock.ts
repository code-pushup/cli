import { join } from 'path';
import { vi } from 'vitest';
import { ProcessConfig, ProcessObserver } from '../src';

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
  } = { throwError: false },
) {
  const args = [
    asyncProcessPath,
    cfg?.interval ? cfg.interval + '' : '10',
    cfg?.runs ? cfg.runs + '' : '4',
    cfg?.throwError ? '1' : '0',
  ];
  return { command: 'node', args };
}

export function mockProcessConfig(
  processConfig: Partial<ProcessConfig>,
): ProcessConfig {
  return {
    ...{
      command: 'dummy-string',
      args: [],
    },
    ...processConfig,
    observer: spyObserver(),
  };
}

/**
 * Helps to set up spy observers for testing.
 */
export function spyObserver(): ProcessObserver {
  const onStdoutSpy = vi.fn();
  const errorSpy = vi.fn();
  const completeSpy = vi.fn();
  return {
    onStdout: onStdoutSpy,
    onError: errorSpy,
    onComplete: completeSpy,
  };
}
