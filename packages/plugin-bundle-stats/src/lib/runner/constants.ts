import type { GroupingOptions, PruningOptions } from './types.js';

export type GroupingRule = GroupingOptions;

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingRule[] = [
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
