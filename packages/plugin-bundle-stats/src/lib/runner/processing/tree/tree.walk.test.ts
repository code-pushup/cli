import {
  type GenericNode,
  type GenericVisitor,
  type PositionState,
  walkGeneric,
} from './tree.walk';

type TestNode = GenericNode<{ type: 'folder' | 'file'; size?: number }>;

const createTestTree = (): TestNode => ({
  name: 'root',
  values: { type: 'folder' },
  children: [
    {
      name: 'src',
      values: { type: 'folder' },
      children: [
        { name: 'index.ts', values: { type: 'file', size: 1024 } },
        { name: 'utils.ts', values: { type: 'file', size: 512 } },
      ],
    },
    {
      name: 'docs',
      values: { type: 'folder' },
      children: [{ name: 'README.md', values: { type: 'file', size: 256 } }],
    },
    { name: 'package.json', values: { type: 'file', size: 128 } },
  ],
});

const createTestVisitor = () => {
  const results: string[] = [];
  const ancestorStates: boolean[] = [];

  const visitor: GenericVisitor<TestNode, string> = {
    enter: (node, pos) => {
      // Build prefix with vertical lines based on ancestor states
      let prefix = '';
      for (let i = 0; i < pos.depth; i++) {
        if (i < ancestorStates.length && !ancestorStates[i]) {
          // Ancestor at this level is not last, so show vertical line
          prefix += '│  ';
        } else {
          // Ancestor at this level is last, so just spaces
          prefix += '   ';
        }
      }

      const marker = pos.isLast ? '└─' : '├─';
      const type = node.values.type === 'folder' ? '📁' : '📄';
      const size = node.values.size ? ` (${node.values.size}b)` : '';

      results.push(`${prefix}${marker} ${type} ${node.name}${size}`);
      return true;
    },
    enterChild: (isLast: boolean) => {
      ancestorStates.push(isLast);
    },
    exitChild: () => {
      ancestorStates.pop();
    },
  };

  return { visitor, results };
};
describe('walkGeneric', () => {
  it('should walk a simple tree structure', () => {
    const tree = createTestTree();
    const { visitor, results } = createTestVisitor();

    walkGeneric(tree, visitor);

    expect(results).toEqual([
      '└─ 📁 root',
      '   ├─ 📁 src',
      '   │  ├─ 📄 index.ts (1024b)',
      '   │  └─ 📄 utils.ts (512b)',
      '   ├─ 📁 docs',
      '   │  └─ 📄 README.md (256b)',
      '   └─ 📄 package.json (128b)',
    ]);
  });

  it('should provide correct position state', () => {
    const positions: PositionState[] = [];
    const tree: TestNode = {
      name: 'root',
      values: { type: 'folder' },
      children: [
        { name: 'file1.txt', values: { type: 'file' } },
        { name: 'file2.txt', values: { type: 'file' } },
        { name: 'file3.txt', values: { type: 'file' } },
      ],
    };

    walkGeneric(tree, {
      enter: (node, pos) => {
        positions.push({ ...pos });
        return true;
      },
    });

    expect(positions).toEqual([
      { index: 0, isFirst: true, isLast: true, depth: 0, siblingCount: 1 }, // root
      { index: 0, isFirst: true, isLast: false, depth: 1, siblingCount: 3 }, // file1
      { index: 1, isFirst: false, isLast: false, depth: 1, siblingCount: 3 }, // file2
      { index: 2, isFirst: false, isLast: true, depth: 1, siblingCount: 3 }, // file3
    ]);
  });

  it('should support early termination', () => {
    const tree = createTestTree();
    const visitedNodes: string[] = [];

    walkGeneric(tree, {
      enter: node => {
        visitedNodes.push(node.name);
        // Stop at 'src' folder
        return node.name !== 'src';
      },
    });

    expect(visitedNodes).toEqual([
      'root',
      'src',
      'docs',
      'README.md',
      'package.json',
    ]);
  });
});

describe('Position-aware connectors', () => {
  it('should receive position information for smart connector logic', () => {
    const tree: TestNode = {
      name: 'root',
      values: { type: 'folder' },
      children: [
        { name: 'first', values: { type: 'file' } },
        { name: 'last', values: { type: 'file' } },
      ],
    };

    const connectors: string[] = [];

    walkGeneric(tree, {
      enter: (node, pos) => {
        if (pos.depth > 0) {
          const connector = pos.isLast ? '└─' : '├─';
          connectors.push(`${connector} ${node.name}`);
        }
        return true;
      },
    });

    expect(connectors).toEqual(['├─ first', '└─ last']);
  });
});
