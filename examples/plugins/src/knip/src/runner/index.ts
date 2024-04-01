import { join } from 'node:path';
import { RunnerConfig } from '@code-pushup/models';
import {
  KNIP_PLUGIN_SLUG,
  KNIP_REPORT_NAME,
  type KnipAudits,
} from '../constants';
import { type CustomReporterOptions } from '../reporter';

/**
 * @description
 * Reduced implementation of the knip CLI arguments.
 * for a lull list see: https://knip.dev/reference/cli
 */
export type KnipCliOptions = Partial<{
  // https://knip.dev/reference/cli#general
  debug: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'config-hints': boolean;
  performance: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'isolate-workspaces': boolean;
  exitCode: boolean;
  // https://knip.dev/reference/cli#configuration
  config: string; // file path
  tsConfig: string;
  workspace: string; // dir path
  directory: string; // dir path
  gitignore: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'include-entry-exports': string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'include-libs': string;
  // https://knip.dev/reference/cli#modes
  production: boolean;
  strict: boolean;
  // https://knip.dev/reference/cli#filter
  exclude: KnipAudits[];
  include: KnipAudits[];
  dependencies: string[];
  exports: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'experimental-tags': string[];
  tags: string[];
}>;
export type RunnerOptions = KnipCliOptions & CustomReporterOptions;

export function createRunnerConfig(options: RunnerOptions = {}): RunnerConfig {
  const {
    outputFile = join(KNIP_PLUGIN_SLUG, KNIP_REPORT_NAME),
    rawOutputFile,
  } = options;
  return {
    command: 'npx',
    args: [
      'knip',
      // off by default to guarantee execution without interference
      '--no-exit-code',
      '--no-progress',
      // code-pushup reporter is used statically
      // @TODO replace with correct path after release (@code-pushup/knip-plugin/src/reporter/index.js)
      '--reporter=./dist/examples/plugins/knip/src/reporter/index.js',
      // code-pushup reporter options are passed as string. See
      `--reporter-options='${JSON.stringify({
        outputFile,
        rawOutputFile,
      } satisfies CustomReporterOptions)}'`,
    ],
    outputFile,
  };
}
