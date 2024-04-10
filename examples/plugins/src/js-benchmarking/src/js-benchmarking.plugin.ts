import type { PluginConfig } from '@code-pushup/models';
import { ensureDirectoryExists } from '@code-pushup/utils';
import { jsBenchmarkingPluginOptionsSchema } from './config';
import {
  JS_BENCHMARKING_DEFAULT_RUNNER_PATH,
  JS_BENCHMARKING_PLUGIN_SLUG,
} from './constants';
import { createRunnerFunction } from './runner';
import type { BenchmarkRunnerOptions } from './runner/types';
import { type LoadOptions, loadSuites, toAuditMetadata } from './utils';

export type PluginOptions = {
  targets: string[];
  runnerPath?: string;
} & LoadOptions &
  BenchmarkRunnerOptions;

export async function jsBenchmarkingPlugin(
  options: PluginOptions,
): Promise<PluginConfig> {
  const {
    tsconfig,
    targets,
    outputDir = '.code-pushup',
    runnerPath = JS_BENCHMARKING_DEFAULT_RUNNER_PATH,
  } = jsBenchmarkingPluginOptionsSchema.parse(options);

  await ensureDirectoryExists(outputDir);
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suites = await loadSuites(targets, { tsconfig });

  return {
    slug: JS_BENCHMARKING_PLUGIN_SLUG,
    title: 'JS Benchmarking',
    icon: 'folder-benchmark',
    audits: toAuditMetadata(suites.map(({ suiteName }) => suiteName)),
    runner: createRunnerFunction(suites, { outputDir, runnerPath }),
  } satisfies PluginConfig;
}
