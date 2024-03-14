import type { CommandLineOptions } from 'knip/dist/types/cli';
import type { Issues as _Issues } from 'knip/dist/types/issues';
import { join } from 'node:path';
import { PluginConfig, RunnerConfig } from '@code-pushup/models';
import { AUDITS } from './constants';

type Issues = Omit<_Issues, 'files'> & { file: string };

// import {knipToCpReport} from "./utils";
// type ResolvedReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : T;
// type KinpReport = ResolvedReturnType<typeof main>;

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
/*
export async function runnerFunction(
  options: RunnerOptions = {} as RunnerOptions,
): Promise<AuditOutputs> {
  const {
    cwd,
    isIncludeEntryExports = false,
    isIsolateWorkspaces = false,
    isProduction = false,
    isStrict = false,
    isFix = false,
    fixTypes = [],
    tags = [[''], ['']] as Tags,
    isNoGitIgnore = false,
  } = options;

  const kinpReport = await main({
    fixTypes,
    cwd: cwd || process.cwd(),
    tags,
    gitignore: isNoGitIgnore,
    tsConfigFile: '',
    isShowProgress: false,
    isStrict,
    isFix,
    isIncludeEntryExports,
    isIsolateWorkspaces,
    isProduction,
  }) as any;

  return knipToCpReport({report: kinpReport.report, issues: kinpReport.issues});
}
*/
export default create;
