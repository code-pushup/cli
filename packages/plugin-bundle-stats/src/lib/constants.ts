import type {
  GroupingOptions,
  PenaltyOptions,
  PruningOptions,
} from './runner/types.js';

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingOptions[] = [
  {
    name: '@angular/*',
    patterns: ['**/node_modules/@angular/**'],
    // icon for angular letter "A"
    icon: '🅰️',
  },
  {
    name: 'packages/*',
    patterns: ['packages/**/*'],
    // folder icon
    icon: '📁',
  },
  {
    name: '@*/*',
    patterns: ['**/node_modules/@*/**', '**/node_modules/**'],
  },
];

/**
 * Default pruning options for bundle stats analysis.
 * These settings control how the bundle tree is simplified and organized.
 */
export const DEFAULT_PRUNING: PruningOptions = {
  maxChildren: 10,
  startDepth: 0,
  maxDepth: 2,
};

export const DEFAULT_PENALTY: PenaltyOptions = {
  warningWeight: 1,
  errorWeight: 2,
};

/**
 * Plugin slug for bundle stats plugin
 */
export const BUNDLE_STATS_PLUGIN_SLUG = 'bundle-stats';
