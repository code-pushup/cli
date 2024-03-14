import type { CommandLineOptions } from 'knip/dist/types/cli';
import { join } from 'node:path';
import { PluginConfig, RunnerConfig } from '@code-pushup/models';
import { AUDITS } from './constants';

export type PluginOptions = RunnerOptions;

type RunnerOptions = Partial<CommandLineOptions> & {
  tsConfig?: string;
  cwd?: string;
} & {
  maxIssues?: number;
  noConfigHints?: boolean;
  noExitCode?: boolean;
  isNoGitIgnore?: boolean;
  isNoProgress?: boolean;
};

export const pluginSlug = 'knip';

export function create(
  options: PluginOptions = {} as PluginOptions,
): PluginConfig {
  return {
    slug: pluginSlug,
    title: 'Knip',
    icon: 'folder-javascript',
    description: 'A plugin to trac dependencies and duplicates',
    runner: runnerConfig(options),
    audits: AUDITS,
  };
}

export function runnerConfig(
  options: RunnerOptions = {} as RunnerOptions,
): RunnerConfig {
  const outputFile = join('.code-pushup', `knip-report-${Date.now()}.json`);
  return {
    command: 'npx',
    args: [
      'knip',
      '--no-exit-code',
      '--reporter=./code-pushup.reporter.ts',
      `--reporter-options='${JSON.stringify({ outputFile })}'`,
    ],
    outputFile,
  };
}

export default create;
