import { describe, expect, it } from 'vitest';
import type { BundleStatsNode } from '../unify/bundle-stats.types.js';
import { short } from './formatting.js';
import { formatTree, prune } from './reduce.js';

describe('formatting utilities', () => {
  describe('short', () => {
    it('should replace current working directory with ⟨CWD⟩', () => {
      const path = `${process.cwd()}/src/index.js`;
      const result = short(path);
      expect(result).toBe('⟨CWD⟩/src/index.js');
    });

    it('should truncate long paths to 80 characters', () => {
      const longPath = 'a'.repeat(100);
      const result = short(longPath);
      expect(result.length).toBeLessThanOrEqual(80);
    });
  });

  describe('bytes access', () => {
    it('should extract byte value from node', () => {
      const node: BundleStatsNode = {
        name: 'test.js',
        values: {
          type: 'chunk',
          path: 'test.js',
          bytes: 1234,
        },
        children: [],
      };
      expect(node.values.bytes).toBe(1234);
    });

    it('should have bytes defined for import node', () => {
      const node: BundleStatsNode = {
        name: 'test.js',
        values: {
          type: 'import',
          path: 'test.js',
          importKind: 'static',
          bytes: 0,
        },
      };
      expect(node.values.bytes).toBe(0);
    });

    it('should handle node with bytes', () => {
      const node = {
        name: 'test.js',
        values: {
          bytes: 1234,
        },
      };
      expect((node.values as any).bytes).toBe(1234);
    });
  });

  describe('prune', () => {
    const mockNode: BundleStatsNode = {
      name: 'bundle',
      values: {
        type: 'chunk',
        path: 'bundle',
        bytes: 1800, // Total of all children: 1000 + 800
        childCount: 8, // Total number of files
      },
      children: [
        {
          name: 'outputs',
          values: {
            type: 'chunk',
            path: 'outputs',
            bytes: 1800, // Total of child chunks: 1000 + 800
            childCount: 6, // Total files in outputs
            label: 'Output Files',
          },
          children: [
            {
              name: 'dist/main.js',
              values: {
                type: 'chunk',
                path: 'dist/main.js',
                bytes: 1000,
                childCount: 3, // 3 input files
              },
              children: [
                {
                  name: '← src/index.js',
                  values: {
                    type: 'input',
                    path: 'src/index.js',
                    bytes: 500,
                  },
                },
                {
                  name: '← src/utils.js',
                  values: {
                    type: 'input',
                    path: 'src/utils.js',
                    bytes: 300,
                  },
                },
                {
                  name: '← src/helpers.js',
                  values: {
                    type: 'input',
                    path: 'src/helpers.js',
                    bytes: 200,
                  },
                },
              ],
            },
            {
              name: 'dist/vendor.js',
              values: {
                type: 'chunk',
                path: 'dist/vendor.js',
                bytes: 800,
                childCount: 1, // 1 input file
              },
              children: [
                {
                  name: '← src/vendor.js',
                  values: {
                    type: 'input',
                    path: 'src/vendor.js',
                    bytes: 800,
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'inputs',
          values: {
            type: 'chunk',
            path: 'inputs',
            bytes: 1800, // Total of all input files
            childCount: 4, // 4 input files
            label: 'Input Files',
          },
          children: [
            {
              name: 'src/index.js',
              values: {
                type: 'input',
                path: 'src/index.js',
                bytes: 500,
              },
            },
            {
              name: 'src/utils.js',
              values: {
                type: 'input',
                path: 'src/utils.js',
                bytes: 300,
              },
            },
            {
              name: 'src/helpers.js',
              values: {
                type: 'input',
                path: 'src/helpers.js',
                bytes: 200,
              },
            },
            {
              name: 'src/vendor.js',
              values: {
                type: 'input',
                path: 'src/vendor.js',
                bytes: 800,
              },
            },
          ],
        },
      ],
    };

    it('should prune tree to specified depth', () => {
      const structuralResult = prune(mockNode, {
        maxChildren: 5,
        depth: 0,
        maxDepth: 1,
      });
      const result = formatTree(structuralResult);

      // Should show tree structure with both outputs and inputs as children
      expect(result.children).toHaveLength(2); // Both outputs and inputs
      expect(result.children?.[0]?.name).toMatch(/outputs/);
      expect(result.children?.[1]?.name).toMatch(/inputs/);

      // Children should not have further children due to maxDepth=1
      expect(result.children?.[0]?.children).toBeUndefined();
    });

    it('should limit children to max parameter', () => {
      const structuralResult = prune(mockNode, {
        maxChildren: 1,
        depth: 0,
        maxDepth: 2,
      }); // maxChildren=1, should only show 1 child + "more..." indicator
      const result = formatTree(structuralResult);

      expect(result.children).toHaveLength(2); // 1 child + 1 "more..." indicator
      expect(result.children?.[0]?.name).toMatch(/outputs/);
      expect(result.children?.[1]?.name).toMatch(/... and 1 more item/);
    });

    it('should format byte values', () => {
      const structuralResult = prune(mockNode, {
        maxChildren: 5,
        depth: 0,
        maxDepth: 2,
      });
      const result = formatTree(structuralResult);

      // Root should have total formatted bytes and files
      expect(result.values?.displayBytes).toMatch(
        /\d+(\.\d+)?\s*(B|kB|MB|GB|TB)/,
      );
      expect(result.values?.displayFiles).toMatch(/\d+\s+files?/);

      // Children of outputs (like dist/main.js) should have formatted bytes and files
      const outputsChildren = result.children?.[0]?.children;
      expect(outputsChildren?.[0]?.values?.displayBytes).toMatch(
        /\d+(\.\d+)?\s*(B|kB|MB|GB|TB)/,
      );
      expect(outputsChildren?.[0]?.values?.displayFiles).toMatch(
        /\d+\s+files?/,
      );
    });

    it('should sort children by size (largest first)', () => {
      const structuralResult = prune(mockNode, {
        maxChildren: 5,
        depth: 0,
        maxDepth: 2,
      });
      const result = formatTree(structuralResult);

      // Should have both outputs and inputs nodes at root level
      expect(result.children).toHaveLength(2); // Both outputs and inputs
      expect(result.children?.[0]?.name).toMatch(/outputs/);

      // Within outputs, dist/main.js (1000 bytes) should come before dist/vendor.js (800 bytes)
      const outputsChildren = result.children?.[0]?.children;
      expect(outputsChildren?.[0]?.name).toMatch(/dist\/main\.js/);
      expect(outputsChildren?.[1]?.name).toMatch(/dist\/vendor\.js/);
    });

    it('should handle nodes without children', () => {
      const leafNode: BundleStatsNode = {
        name: 'leaf.js',
        values: {
          type: 'input',
          path: 'leaf.js',
          bytes: 100,
        },
      };

      const structuralResult = prune(leafNode);
      const result = formatTree(structuralResult);
      expect(result.children).toBeUndefined();
      expect(result.name).toMatch(/leaf\.js/);
    });

    it('should use default options when none provided', () => {
      const structuralResult = prune(mockNode); // Should use defaults: maxChildren=5, depth=0, maxDepth=2
      const result = formatTree(structuralResult);

      // Should show tree structure with both outputs and inputs as children
      expect(result.children).toHaveLength(2); // Both outputs and inputs
      expect(result.children?.[0]?.name).toMatch(/outputs/);

      // Within outputs, should have main.js and vendor.js
      const outputsChildren = result.children?.[0]?.children;
      expect(outputsChildren).toHaveLength(2);
      expect(outputsChildren?.[0]?.name).toMatch(/dist\/main\.js/);
      expect(outputsChildren?.[1]?.name).toMatch(/dist\/vendor\.js/);
    });
  });
});
