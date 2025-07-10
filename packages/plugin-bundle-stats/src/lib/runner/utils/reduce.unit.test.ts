import { describe, expect, it } from 'vitest';
import { type GroupingRule, type PruningOptions } from '../types.js';
import {
  type BundleStatsNode,
  type ChunkNode,
  type GroupNode,
} from '../unify/bundle-stats.types.js';
import { applyGroupingToTree, formatTree, prune } from './reduce.js';

describe('prune', () => {
  const createPruneTestNode = (
    name: string,
    bytes: number,
    children?: BundleStatsNode[],
  ): ChunkNode => ({
    name,
    values: {
      type: 'chunk',
      path: name,
      bytes,
      childCount: children?.length || 0,
      entryPoint: false,
    },
    children,
  });

  it('should return pruned node structure', () => {
    const node = createPruneTestNode('root', 1000);
    const result = prune(node);
    expect(result.name).toBe('root');
    expect(result.values?.bytes).toBe(1000);
    expect(result.values?.fileCount).toBeDefined();
  });

  it('should respect maxDepth parameter', () => {
    const deepNode = createPruneTestNode('level2', 100);
    const midNode = createPruneTestNode('level1', 200, [deepNode]);
    const rootNode = createPruneTestNode('root', 300, [midNode]);

    const result = prune(rootNode, { maxDepth: 1 });

    // At maxDepth 1, should show children at depth 0 but not at depth 1
    expect(result.children).toHaveLength(1);
    expect(result.children![0]!.name).toBe('level1');
    expect(result.children![0]!.children).toBeUndefined(); // No grandchildren
  });

  it('should not filter out any nodes (including "inputs")', () => {
    const node = createPruneTestNode('root', 1000, [
      createPruneTestNode('inputs', 100),
      createPruneTestNode('outputs', 200),
      createPruneTestNode('regular', 300),
    ]);

    const result = prune(node, { maxChildren: 5, maxDepth: 2 });

    // All 3 children should be included (no filtering)
    expect(result.children).toHaveLength(3);
    const names = result.children!.map(child => child.name);
    expect(names).toEqual(['inputs', 'outputs', 'regular']);
  });
});

describe('applyGroupingToTree', () => {
  const createMockInputNode = (
    path: string,
    bytes: number,
    name?: string,
  ): GroupNode => ({
    name: path,
    values: {
      type: 'group',
      path,
      bytes,
      childCount: 0,
    },
    children: undefined,
  });

  const createMockChunkNode = (
    name: string,
    bytes: number,
    children?: BundleStatsNode[],
  ): ChunkNode => ({
    name,
    values: {
      type: 'chunk',
      path: name,
      bytes,
      childCount: children?.length || 0,
      entryPoint: false,
    },
    children,
  });

  it('should group node_modules files by package name using grouping rules', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'node_modules',
        patterns: ['**/node_modules/**'],
        maxDepth: 0,
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 500),
      createMockInputNode('node_modules/@angular/core/common.js', 300),
      createMockInputNode('node_modules/rxjs/index.js', 200),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    expect(result.children).toHaveLength(3); // src/app.js + @angular/core group + rxjs group

    // Find the grouped node_modules entries
    const angularGroup = result.children!.find(
      child => child.name === '@angular/core',
    );
    expect(angularGroup).toBeDefined();
    expect(angularGroup!.values.bytes).toBe(800); // 500 + 300
    expect(angularGroup!.values.childCount).toBe(2);
    expect(angularGroup!.children).toHaveLength(2);

    const rxjsGroup = result.children!.find(child => child.name === 'rxjs');
    expect(rxjsGroup).toBeDefined();
    expect(rxjsGroup!.values.bytes).toBe(200);
    expect(rxjsGroup!.values.childCount).toBe(1);

    // src file should remain ungrouped (using full path as name now)
    const srcFile = result.children!.find(child => child.name === 'src/app.js');
    expect(srcFile).toBeDefined();
  });

  it('should group packages files by package name using grouping rules', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'packages',
        patterns: ['**/packages/**'],
        maxDepth: 0,
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/core/src/utils.js', 300),
      createMockInputNode('packages/utils/src/index.js', 200),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    expect(result.children).toHaveLength(3); // src/app.js + core/ + utils/

    const coreGroup = result.children!.find(child => child.name === 'core/');
    expect(coreGroup).toBeDefined();
    expect(coreGroup!.values.bytes).toBe(800); // 500 + 300
    expect(coreGroup!.values.childCount).toBe(2);

    const utilsGroup = result.children!.find(child => child.name === 'utils/');
    expect(utilsGroup).toBeDefined();
    expect(utilsGroup!.values.bytes).toBe(200);
    expect(utilsGroup!.values.childCount).toBe(1);
  });

  it('should not group when no grouping rules are provided', () => {
    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/core/src/utils.js', 300),
      createMockInputNode('packages/utils/src/index.js', 200),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, { depth: 0 });

    // Without grouping rules, all 4 children should remain ungrouped
    expect(result.children).toHaveLength(4);

    // All children should be original nodes, no groups created
    const names = result.children!.map(child => child.name);
    expect(names).toEqual([
      'packages/core/src/index.js',
      'packages/core/src/utils.js',
      'packages/utils/src/index.js',
      'src/app.js',
    ]);
  });

  it('should respect depth parameter in grouping rules', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'deep-node-modules',
        patterns: ['**/node_modules/**'],
        maxDepth: 1, // Only apply at depth 1
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 500),
      createMockInputNode('src/app.js', 100),
    ]);

    // At depth 0, grouping rule shouldn't apply - expect original structure
    expect(
      applyGroupingToTree(tree, {
        grouping: groupingRules,
        depth: 0,
      }),
    ).toStrictEqual({
      name: 'bundle',
      values: {
        type: 'chunk',
        path: 'bundle',
        bytes: 0,
        childCount: 2,
        isEntryFile: true,
      },
      children: [
        {
          name: 'node_modules/@angular/core/index.js',
          values: {
            type: 'group',
            path: 'node_modules/@angular/core/index.js',
            bytes: 500,
            childCount: 0,
          },
          children: undefined,
        },
        {
          name: 'src/app.js',
          values: {
            type: 'group',
            path: 'src/app.js',
            bytes: 100,
            childCount: 0,
          },
          children: undefined,
        },
      ],
    });
  });

  it('should recursively apply grouping to nested children', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'node_modules',
        patterns: ['**/node_modules/**'],
        maxDepth: 0,
      },
    ];

    const nestedChild = createMockChunkNode('nested', 0, [
      createMockInputNode('node_modules/lodash/index.js', 50),
    ]);

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 500),
      nestedChild,
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Check that nested children were also processed
    const nestedChild2 = result.children!.find(
      child => child.name === 'nested',
    );
    expect(nestedChild2).toBeDefined();
    expect(nestedChild2!.children).toHaveLength(1); // lodash should be grouped
  });

  it('should set icons on grouped nodes with 📦 as default', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'node_modules',
        patterns: ['**/node_modules/**'],
        maxDepth: 0,
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 500),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Find the grouped node
    const angularGroup = result.children!.find(
      child => child.name === '@angular/core',
    );
    expect(angularGroup).toBeDefined();
    expect(angularGroup!.values.icon).toBe('📦'); // Default icon
  });

  it('should handle packages grouping rule with custom icon', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'packages',
        patterns: ['**/packages/**'],
        maxDepth: 0,
        icon: '📄',
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/core/src/utils.js', 300),
      createMockInputNode('packages/utils/src/index.js', 200),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Should create two groups with the custom icon
    expect(result.children).toHaveLength(3); // src/app.js + core/ + utils/

    const coreGroup = result.children!.find(child => child.name === 'core/');
    expect(coreGroup).toBeDefined();
    expect(coreGroup!.values.icon).toBe('📄'); // Custom icon

    const utilsGroup = result.children!.find(child => child.name === 'utils/');
    expect(utilsGroup).toBeDefined();
    expect(utilsGroup!.values.icon).toBe('📄'); // Custom icon
  });

  it('should work with formatting pipeline - icons should appear in final formatted names', () => {
    const groupingRules: GroupingRule[] = [
      {
        title: 'packages',
        patterns: ['**/packages/**'],
        maxDepth: 0,
        icon: '📄',
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/core/src/utils.js', 300),
    ]);

    const grouped = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Look for the grouped node
    const coreGroup = grouped.children!.find(child => child.name === 'core/');
    expect(coreGroup).toBeDefined();
    expect(coreGroup!.values.icon).toBe('📄');
  });
});

describe('formatTree', () => {
  const createMockChunkNode = (
    name: string,
    bytes: number,
    children?: BundleStatsNode[],
  ): ChunkNode => ({
    name,
    values: {
      type: 'chunk',
      path: name,
      bytes,
      childCount: children?.length || 0,
      entryPoint: false,
    },
    children,
  });

  it('should format chunk node with entry point information', () => {
    const entryChunkNode = createMockChunkNode('main.js', 1000);
    entryChunkNode.values.entryPoint = true;

    const result = formatTree(entryChunkNode);

    expect(result.name).toBe('main.js');
    expect(result.values?.displayBytes).toBe('1000 B');
  });

  it('should handle entry point nodes with custom icons', () => {
    const entryChunkNode = createMockChunkNode('main.js', 1000);
    entryChunkNode.values.entryPoint = true;

    const result = formatTree(entryChunkNode);

    expect(result.name).toBe('main.js');
    expect(result.values?.displayBytes).toBe('1000 B');
  });
});
