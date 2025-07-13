import type { GroupingRule } from './types.js';

export type { GroupingRule };

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingRule[] = [
  {
    title: '@angular/*',
    patterns: ['**/node_modules/@angular/**'],
    icon: '🅰️',
  },
  {
    title: 'packages/*',
    patterns: ['packages/**/*'],
    icon: '📦',
  },
  {
    title: 'rx-signals',
    patterns: ['**/node_modules/rx-signals/**'],
    icon: '🚦',
  },
  {
    title: 'rxjs',
    patterns: ['**/node_modules/rxjs/**'],
    icon: ' rxjs',
  },
  {
    title: '@code-pushup/models',
    patterns: ['**/node_modules/@code-pushup/models/**'],
  },
  {
    title: '@code-pushup/utils',
    patterns: ['**/node_modules/@code-pushup/utils/**'],
  },
  {
    title: '@*/*',
    patterns: ['**/node_modules/@*/**', '**/node_modules/**'],
  },
];
