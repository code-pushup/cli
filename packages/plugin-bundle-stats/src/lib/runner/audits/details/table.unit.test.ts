import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../../types.js';
import type { UnifiedStats } from '../../unify/unified-stats.types.js';
import { aggregateAndSortGroups } from './table.js';

describe('aggregateAndSortGroups', () => {
  it('should correctly aggregate, group, and sort stats', () => {
    const stats: UnifiedStats = {
      'dist/main.js': {
        path: 'dist/main.js',
        bytes: 1000,
        inputs: {
          'src/ui/button.ts': { bytes: 800 }, // matches ui pattern
        },
        // remaining 200 bytes will match dist/*.js pattern
      },
      'dist/chunks/vendor.js': {
        path: 'dist/chunks/vendor.js',
        bytes: 2000,
        inputs: {
          'node_modules/react/index.js': { bytes: 2000 }, // matches react pattern
        },
        // no remaining bytes
      },
      'dist/other.js': {
        path: 'dist/other.js',
        bytes: 500,
        // no inputs, all 500 bytes remain unmatched (rest group)
      },
    };

    const insights: GroupingRule[] = [
      { title: 'ui', patterns: ['**/ui/**'] },
      { title: 'react', patterns: ['**/react/**'], icon: '📦' },
      { title: 'Source', patterns: ['dist/*.js'], icon: '📄' },
    ];

    expect(aggregateAndSortGroups(stats, insights)).toStrictEqual({
      groups: [
        { title: 'react', icon: '📦', totalBytes: 2000 },
        { title: 'ui', icon: undefined, totalBytes: 800 },
        { title: 'main', icon: '📄', totalBytes: 200 },
      ],
      restGroup: { totalBytes: 500, title: 'Rest' },
    });
  });
});
