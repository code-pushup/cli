export {
  create as fileSizePlugin,
  audits as fileSizeAudits,
  recommendedRefs as fileSizeRecommendedRefs,
  type PluginOptions as FileSizePluginOptions,
} from './file-size/src/file-size.plugin.js';
export {
  recommendedRefs as packageJsonRecommendedRefs,
  versionControlGroupRef as packageJsonVersionControlGroupRef,
  documentationGroupRef as packageJsonDocumentationGroupRef,
  performanceGroupRef as packageJsonPerformanceGroupRef,
} from './package-json/src/scoring.js';
export { create as packageJsonPlugin } from './package-json/src/package-json.plugin.js';
export {
  create as lighthousePlugin,
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  recommendedRefs as lighthouseCorePerfGroupRefs,
} from './lighthouse/src/index.js';
