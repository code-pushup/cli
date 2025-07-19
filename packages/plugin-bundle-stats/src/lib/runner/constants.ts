import type { GroupingRule } from './types.js';

export type { GroupingRule };

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingRule[] = [
  {
    title: 'Projects',
    patterns: ['projects/**/*'],
    icon: '📦',
  },
  {
    title: 'Packages',
    patterns: ['packages/**/*'],
    icon: '📦',
  },
  {
    title: 'Node Modules',
    patterns: ['**/node_modules/@*/**', '**/node_modules/**'],
    icon: '📦',
  },
];
