import { describe, expect, it } from 'vitest';
import type { UnifiedStats } from '../../unify/unified-stats.types';
import { createTree } from './tree';

describe('createTree', () => {
  it('should create a tree', () => {
    const mockStats: UnifiedStats = {
      'main.js': {
        path: 'main.js',
        bytes: 1024,
        imports: [],
        inputs: {
          'src/main.ts': {
            bytes: 512,
          },
        },
        entryPoint: 'src/main.ts',
      },
    };

    const result = createTree(mockStats, {
      title: 'Test Bundle',
      groups: [],
      pruning: {},
    });

    expect(result).toHaveProperty('root');
    expect(result.root).toHaveProperty('name', '🗂️ Test Bundle');
    expect(result.root).toHaveProperty('values');
    expect(result.root).toHaveProperty('children');
  });
});
