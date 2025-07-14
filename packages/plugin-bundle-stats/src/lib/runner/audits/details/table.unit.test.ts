import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import { aggregateAndSortGroups } from './table.js';

describe('aggregateAndSortGroups', () => {
  it('should correctly aggregate, group, and sort stats', () => {
    const stats: UnifiedStats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 1001,
        inputs: {
          'src/main.ts': { bytes: 1001 },
        },
      },
      'dist/chunks/ui.js': {
        path: 'dist/chunks/ui.js',
        bytes: 3001,
        inputs: {
          'src/ui/button.ts': { bytes: 1500 },
          'src/ui/modal.ts': { bytes: 1501 },
        },
      },
      'dist/chunks/utils.js': {
        path: 'dist/chunks/utils.js',
        bytes: 2000,
        inputs: {
          'src/utils/helpers.ts': { bytes: 1000 },
          'src/utils/constants.ts': { bytes: 1000 },
        },
      },
      'dist/node_modules/react.js': {
        path: 'dist/node_modules/react.js',
        bytes: 3000,
        inputs: {
          'node_modules/react/index.js': { bytes: 3000 },
        },
      },
      'dist/node_modules/lodash.js': {
        path: 'dist/node_modules/lodash.js',
        bytes: 1500,
        inputs: {
          'node_modules/lodash/lodash.js': { bytes: 1500 },
        },
      },
      'dist/other.js': {
        path: 'dist/other.js',
        bytes: 4498,
        inputs: {
          'src/other.ts': { bytes: 4498 },
        },
      },
      'dist/another.js': {
        path: 'dist/another.js',
        bytes: 1500,
        inputs: {
          'src/another.ts': { bytes: 1500 },
        },
      },
    };

    const insights: GroupingRule[] = [
      { title: 'ui', patterns: ['**/ui/**'] },
      { title: 'utils', patterns: ['**/utils/**'] },
      { title: 'react', patterns: ['**/react/**'], icon: '📦' },
      { title: 'lodash', patterns: ['**/lodash/**'], icon: '📦' },
      { title: 'Source', patterns: ['dist/*.js'], icon: '📄' },
      { title: 'Bundles', patterns: ['dist/*.js'], icon: '📦' },
    ];
    expect(aggregateAndSortGroups(stats, insights)).toStrictEqual({
      groups: [
        { title: 'other', icon: '📄', totalBytes: 4498 },
        { title: 'ui', icon: undefined, totalBytes: 3001 },
        { title: 'react', icon: '📦', totalBytes: 3000 },
        { title: 'utils', icon: undefined, totalBytes: 2000 },
        { title: 'lodash', icon: '📦', totalBytes: 1500 },
        { title: 'another', icon: '📄', totalBytes: 1500 },
        { title: 'main', icon: '📄', totalBytes: 1001 },
      ],
      restGroup: { totalBytes: 0, title: 'Rest' },
    });
  });
});
