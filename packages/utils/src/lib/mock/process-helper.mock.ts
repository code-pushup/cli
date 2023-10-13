import { join } from 'path';
import { vi } from 'vitest';
import { ProcessConfig } from '../execute-process';

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

/**
 * Helps to get a sync process runner config for testing.
 *
 * @param cfg
 */
export function getSyncProcessRunnerConfig(
  cfg: Partial<ProcessConfig> & {
    throwError?: boolean;
    outputFile?: string;
  } = { throwError: false },
) {
  return {
    command: 'node',
    args: [
      '-e',
      `require('fs').writeFileSync('${cfg.outputFile}', '${JSON.stringify({
        audits: cfg.throwError
          ? ({ throwError: cfg.throwError } as unknown)
          : [],
      })}')`,
    ],
    outputFile: cfg.outputFile,
  };
}

export function mockProcessConfig(
  processConfig: Partial<ProcessConfig>,
): ProcessConfig {
  return {
    ...{ command: 'dummy-string', args: [], outputFile: 'tmp/out.json' },
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
