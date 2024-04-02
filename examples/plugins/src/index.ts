export {
  create as fileSizePlugin,
  audits as fileSizeAudits,
  recommendedRefs as fileSizeRecommendedRefs,
  PluginOptions as FileSizePluginOptions,
} from './file-size/src/file-size.plugin';
export {
  recommendedRefs as packageJsonRecommendedRefs,
  versionControlGroupRef as packageJsonVersionControlGroupRef,
  documentationGroupRef as packageJsonDocumentationGroupRef,
  performanceGroupRef as packageJsonPerformanceGroupRef,
} from './package-json/src/scoring';
export { create as packageJsonPlugin } from './package-json/src/package-json.plugin';
export {
  create as lighthousePlugin,
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  recommendedRefs as lighthouseCorePerfGroupRefs,
} from './lighthouse/src/index';
export {
  jsBenchmarkingPlugin,
  jsBenchmarkingSuiteNameToCategoryRef,
  JsBenchmarkingPluginConfig,
  JS_BENCHMARKING_PLUGIN_SLUG,
  JS_BENCHMARKING_BENCHMARK_RUNNER_PATH,
  JS_BENCHMARKING_BENNY_RUNNER_PATH,
  JS_BENCHMARKING_TINYBENCH_RUNNER_PATH,
  JS_BENCHMARKING_DEFAULT_RUNNER_PATH,
} from './js-benchmarking/src/index';
