import { bundleStatsPlugin } from './lib/bundle-stats-plugin';

export type {
  BundleStatsAuditOptions as BundleStatsOptions,
  PluginOptions,
} from './lib/types.js';
export type {
  GroupingRule,
  PatternList,
  BundleStatsConfig as BundleStatsConfig,
} from './lib/runner/types.js';
export type { BlacklistEntry } from './lib/runner/audits/scoring.js';

export default bundleStatsPlugin;
export { DEFAULT_GROUPING, DEFAULT_PRUNING } from './lib/constants.js';
