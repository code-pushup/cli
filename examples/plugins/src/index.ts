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
