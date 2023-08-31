import { ProcessConfig } from './execute-process';
import { join } from 'path';
import { pluginConfigSchema } from '@quality-metrics/models';

/**
 * Helps to use/configure the mock plugin in tests.
 *
 * @example
 *
 * // Example data
 * const pluginCfg = mockPlugin({ invalidPlugin: true, invalidRunnerOutput: false });
 *
 * @param opt
 */
export function mockPlugin(
  opt: { invalidPlugin?: boolean; invalidRunnerOutput?: boolean } = {
    invalidPlugin: false,
    invalidRunnerOutput: false,
  },
) {
  const outputPath = 'out-execute-plugin.json';
  return  pluginConfigSchema({
    audits: [],
    runner: {
      command: 'bash',
      args: [
        '-c',
        `echo '${JSON.stringify({
          audits: opt?.invalidPlugin
            ? ({ invalidPlugin: opt.invalidPlugin } as unknown)
            : opt?.invalidRunnerOutput
            ? ''
            : [],
          date: new Date().toISOString(),
          duration: 200,
        })}' > ${outputPath}`,
      ],
      outputPath: outputPath,
    },
    groups: [],
    meta: {
      slug: 'execute-plugin',
      name: 'execute plugin',
      type: 'static-analysis',
    },
  });
}

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
  } = { throwError: false },
) {
  const args = [asyncProcessPath];
  cfg?.interval ? args.push(cfg?.interval + '') : args.push('10');
  cfg?.runs ? args.push(cfg?.runs + '') : args.push('4');
  cfg?.throwError ? args.push('1') : args.push('0');
  return { command: 'node', args, outputPath: './out-async-runner.json' };
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
        audits: cfg.throwError ? ({ throwError: cfg.throwError } as unknown) : [],
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
