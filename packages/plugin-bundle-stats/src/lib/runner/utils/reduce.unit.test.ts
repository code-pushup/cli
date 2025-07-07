import { describe, expect, it } from 'vitest';
import type { GroupingRule } from '../types.js';
import type {
  BundleStatsNode,
  ChunkNode,
  GroupNode,
} from '../unify/bundle-stats.types.js';
import { type PruneOptions, applyGroupingToTree, prune } from './reduce.js';

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
      totalSize: bytes,
      isEntryFile: false,
    },
    children: children || [],
  });

  it('should limit children to maxChildren parameter', () => {
    const node = createPruneTestNode('root', 1000, [
      createPruneTestNode('child1', 100),
      createPruneTestNode('child2', 200),
      createPruneTestNode('child3', 300),
      createPruneTestNode('child4', 400),
      createPruneTestNode('child5', 500),
      createPruneTestNode('child6', 600),
    ]);

    const result = prune(node, { maxChildren: 3, maxDepth: 2 });

    // Should have exactly 4 children (3 actual + 1 "more" indicator since we re-added createMoreNode logic)
    expect(result.children).toHaveLength(4);
    expect(result.children![3]!.name).toMatch(/... and 3 more items/);

    // Verify it returns StructuralNode with bytes and fileCount
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
      type: 'input',
      path,
      bytes,
      childCount: 0,
    },
    children: undefined,
  });

  const createMockChunkNode = (
    name: string,
    bytes: number,
    children: BundleStatsNode[],
  ): ChunkNode => ({
    name,
    values: {
      type: 'chunk',
      path: name,
      bytes,
      childCount: children.length,
      isEntryFile: true,
    },
    children,
  });

  it('should group node_modules files by package name using grouping rules', () => {
    const groupingRules: GroupingRule[] = [
      {
        name: 'node_modules',
        patterns: ['**/node_modules/**'],
        depth: 0,
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
        name: 'packages',
        patterns: ['**/packages/**'],
        depth: 0,
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
        name: 'deep-node-modules',
        patterns: ['**/node_modules/**'],
        depth: 1, // Only apply at depth 1
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
            type: 'input',
            path: 'node_modules/@angular/core/index.js',
            bytes: 500,
            childCount: 0,
          },
          children: undefined,
        },
        {
          name: 'src/app.js',
          values: {
            type: 'input',
            path: 'src/app.js',
            bytes: 100,
            childCount: 0,
          },
          children: undefined,
        },
      ],
    });
  });

  it('should return node unchanged when no children exist', () => {
    const leafNode = createMockInputNode('src/app.js', 100);

    const result = applyGroupingToTree(leafNode);

    expect(result).toEqual(leafNode);
  });

  it('should recursively apply grouping to nested children', () => {
    const groupingRules: GroupingRule[] = [
      {
        name: 'node_modules',
        patterns: ['**/node_modules/**'],
      },
    ];

    const nestedChild = createMockChunkNode('nested', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 200),
      createMockInputNode('node_modules/rxjs/index.js', 100),
    ]);

    const tree = createMockChunkNode('bundle', 0, [
      nestedChild,
      createMockInputNode('src/app.js', 300),
    ]);

    const result = applyGroupingToTree(tree, { grouping: groupingRules });

    // Check that nested children were also grouped
    const nestedResult = result.children!.find(
      child => child.name === 'nested',
    ) as ChunkNode;
    expect(nestedResult.children).toHaveLength(2); // @angular/core + rxjs groups

    const angularGroup = nestedResult.children!.find(
      child => child.name === '@angular/core',
    );
    expect(angularGroup).toBeDefined();
    expect(angularGroup!.values.bytes).toBe(200);
  });

  it('should set icons on grouped nodes with 📦 as default', () => {
    const groupingRules: GroupingRule[] = [
      {
        name: 'node_modules',
        patterns: ['**/node_modules/**'],
        icon: 'package', // Custom icon
      },
      {
        name: 'packages',
        patterns: ['**/packages/**'],
        // No icon specified - should default to '📦'
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('node_modules/@angular/core/index.js', 500),
      createMockInputNode('packages/core/src/index.js', 300),
      createMockInputNode('src/app.js', 100),
    ]);

    const result = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Find the node_modules group (should have custom icon)
    const nodeModulesGroup = result.children!.find(
      child => child.name === '@angular/core',
    );
    expect(nodeModulesGroup).toBeDefined();
    expect(nodeModulesGroup!.values.icon).toBe('package');

    // Find the packages group (should have default icon)
    const packagesGroup = result.children!.find(
      child => child.name === 'core/',
    );
    expect(packagesGroup).toBeDefined();
    expect(packagesGroup!.values.icon).toBe('📦');

    // Ungrouped file should not have icon
    const srcFile = result.children!.find(child => child.name === 'src/app.js');
    expect(srcFile).toBeDefined();
    expect(srcFile!.values.icon).toBeUndefined();
  });

  it('should handle packages grouping rule with custom icon', () => {
    const groupingRules: GroupingRule[] = [
      {
        name: 'packages/*',
        patterns: ['packages/**/*'],
        icon: '📄',
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/utils/src/helper.js', 300),
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
    expect(coreGroup!.values.icon).toBe('📄');

    const utilsGroup = result.children!.find(child => child.name === 'utils/');
    expect(utilsGroup).toBeDefined();
    expect(utilsGroup!.values.icon).toBe('📄');

    // Ungrouped file should not have icon
    const srcFile = result.children!.find(child => child.name === 'src/app.js');
    expect(srcFile).toBeDefined();
    expect(srcFile!.values.icon).toBeUndefined();
  });

  it('should work with formatting pipeline - icons should appear in final formatted names', () => {
    const groupingRules: GroupingRule[] = [
      {
        name: 'packages/*',
        patterns: ['packages/**/*'],
        icon: '📄',
      },
    ];

    const tree = createMockChunkNode('bundle', 0, [
      createMockInputNode('packages/core/src/index.js', 500),
      createMockInputNode('packages/utils/src/helper.js', 300),
      createMockInputNode('src/app.js', 100),
    ]);

    // Apply grouping (this sets the icon in values)
    const groupedResult = applyGroupingToTree(tree, {
      grouping: groupingRules,
      depth: 0,
    });

    // Verify icons are set in values
    const coreGroup = groupedResult.children!.find(
      child => child.name === 'core/',
    );
    expect(coreGroup).toBeDefined();
    expect(coreGroup!.values.icon).toBe('📄');
  });
});
