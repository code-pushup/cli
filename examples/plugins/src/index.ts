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
  knipPlugin,
  knipCategoryAuditRef,
  knipCategoryGroupRef,
  KNIP_PLUGIN_SLUG,
  KNIP_RAW_REPORT_NAME,
  KNIP_REPORT_NAME,
} from './knip/src/index';
