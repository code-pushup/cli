import { vi } from 'vitest';
import { ProcessConfig } from '../execute-process';
import { join } from 'path';

const asyncProcessPath = join(__dirname, './execute-process.mock.mjs');

/**
 * Helps to get a async process runner config for testing.
 *
 * @param cfg
 */
export function getAsyncProcessRunnerConfig(
  cfg: Partial<ProcessConfig> & {
    throwError?: boolean;
    interval?: number;
    runs?: number;
    outputPath?: string;
  } = { throwError: false },
) {
  const outputPath = cfg?.outputPath || './tmp/out-async-runner.json';
  const args = [
    asyncProcessPath,
    cfg?.interval ? cfg.interval + '' : '10',
    cfg?.runs ? cfg.runs + '' : '4',
    cfg?.throwError ? '1' : '0',
    outputPath,
  ];
  return { command: 'node', args, outputPath };
}

/**
 * Helps to get a sync process runner config for testing.
 *
 * @param cfg
 */
export function getSyncProcessRunnerConfig(
  cfg: Partial<ProcessConfig> & {
    throwError?: boolean;
    outputPath?: string;
  } = { throwError: false },
) {
  return {
    command: 'bash',
    args: [
      '-c',
      `echo '${JSON.stringify({
        audits: cfg.throwError
          ? ({ throwError: cfg.throwError } as unknown)
          : [],
      })}' > ${cfg.outputPath}`,
    ],
    outputPath: cfg.outputPath,
  };
}

export function mockProcessConfig(
  processConfig: Partial<ProcessConfig>,
): ProcessConfig {
  return {
    ...{ command: 'dummy-string', args: [], outputPath: './out.json' },
    ...processConfig,
    observer: spyObserver(),
  };
}

/**
 * Helps to set up spy observers for testing.
 */
export function spyObserver() {
  const nextSpy = vi.fn();
  const errorSpy = vi.fn();
  const completeSpy = vi.fn();
  return {
    next: nextSpy,
    error: errorSpy,
    complete: completeSpy,
  };
}
