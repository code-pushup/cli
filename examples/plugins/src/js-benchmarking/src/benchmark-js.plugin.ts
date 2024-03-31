import {PluginConfig,} from '@code-pushup/models';
import {LoadOptions, loadSuites, toAuditMetadata,} from './utils';
import {JS_BENCHMARKING_DEFAULT_RUNNER_PATH, JS_BENCHMARKING_PLUGIN_SLUG} from "./constants";
import {createRunnerFunction} from "./runner";
import {jsBenchmarkingPluginConfigSchema} from "./config";

export type PluginOptions = {
  targets: string[];
  outputDir?: string;
  verbose?: boolean;
  runnerPath?: string;
} & LoadOptions;

export async function jsBenchmarkingPlugin(options: unknown): Promise<PluginConfig> {
  const { tsconfig, targets, outputDir, runnerPath = JS_BENCHMARKING_DEFAULT_RUNNER_PATH } = jsBenchmarkingPluginConfigSchema.parse(options);
  // load the suites at before returning the plugin config to be able to return a more dynamic config
  const suites = await loadSuites(targets, { tsconfig });

  return {
    slug: JS_BENCHMARKING_PLUGIN_SLUG,
    title: 'JS Benchmarking',
    icon: 'folder-benchmark',
    audits: toAuditMetadata(suites.map(({ suiteName }) => suiteName)),
    runner: createRunnerFunction(suites, { outputDir, runnerPath  }),
  } satisfies PluginConfig;
}
