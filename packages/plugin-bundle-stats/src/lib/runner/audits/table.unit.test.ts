import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../types';
import type { UnifiedStats } from '../unify/unified-stats.types';
import { aggregateAndSortGroups } from './table';

describe('aggregateAndSortGroups', () => {
  it('should correctly aggregate, group, and sort stats', () => {
    const stats: UnifiedStats = {
      'main.js': {
        path: 'dist/main.js',
        bytes: 5000,
        inputs: {
          'node_modules/react/index.js': { bytes: 3000 },
          'src/main.ts': { bytes: 1001 },
        },
      },
      'app.js': {
        path: 'dist/app.js',
        bytes: 7000,
        inputs: {
          'packages/utils/index.js': { bytes: 2000 },
          'packages/ui/button.js': { bytes: 3001 },
          'node_modules/lodash/index.js': { bytes: 1500 },
        },
      },
      'bundle.js': {
        path: 'dist/bundle.js',
        bytes: 2000,
      },
      'chunk.js': {
        path: 'dist/chunk.js',
        bytes: 1500,
        inputs: {},
      },
      'styles.css': { path: 'dist/styles.css', bytes: 1000 },
    };
    const insights: GroupingRule[] = [
      {
        title: 'Dependencies',
        patterns: ['node_modules/**'],
        icon: '📦',
      },
      {
        title: 'Internal Packages',
        patterns: ['packages/**'],
      },
      { title: 'Source', patterns: ['src/**'], icon: '📄' },
      { title: 'Bundles', patterns: ['dist/*.js'], icon: '📦' },
    ];
    expect(aggregateAndSortGroups(stats, insights)).toStrictEqual({
      groups: [
        { title: 'ui', icon: undefined, totalBytes: 3001 },
        { title: 'react', icon: '📦', totalBytes: 3000 },
        { title: 'utils', icon: undefined, totalBytes: 2000 },
        { title: 'lodash', icon: '📦', totalBytes: 1500 },
        { title: 'Source', icon: '📄', totalBytes: 1001 },
      ],
      restGroup: { totalBytes: 5998, title: 'Rest' },
    });
  });
});
