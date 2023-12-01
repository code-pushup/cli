export {
  create as fileSizePlugin,
  audits as fileSizeAudits,
  recommendedRefs as fileSizeRecommendedRefs,
  PluginOptions as FileSizePluginOptions,
} from './file-size/file-size.plugin';
export {
  create as packageJsonPlugin,
  audits as packageJsonAudits,
  recommendedRefs as packageJsonRecommendedRefs,
  PluginOptions as PackageJsonPluginOptions,
} from './package-json.plugin/package-json.plugin';
