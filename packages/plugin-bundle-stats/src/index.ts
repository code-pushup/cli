import { bundleStatsPlugin } from './lib/bundle-stats-plugin';

export type { BundleStatsOptions, PluginOptions } from './lib/types.js';
export type {
  GroupingRule,
  PatternList,
  BundleStatsConfig,
} from './lib/runner/types.js';

export default bundleStatsPlugin;
export { DEFAULT_GROUPING, DEFAULT_PRUNING } from './lib/constants.js';
