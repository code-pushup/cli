import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { materializeTree } from './tree.js';

// Import the testing utility with a type assertion to work around module resolution issues
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
const { createTreeWithEmptyWorkspace } =
  require('nx/src/generators/testing-utils/create-tree-with-empty-workspace') as {
    createTreeWithEmptyWorkspace: (opts?: { layout?: 'apps-libs' }) => any;
  };

describe('materializeTree', () => {
  const baseDir = path.join('tmp', 'materialize-tree');

  it('should create files from tree', async () => {
    const root = path.join(baseDir, 'materialize');

    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    expect(tree.exists('nx.json')).toBe(true);

    await materializeTree(tree, root);
    const nxJson = JSON.parse(
      await readFile(path.join(root, 'nx.json'), 'utf8'),
    );
    expect(nxJson).toStrictEqual({
      affected: {
        defaultBase: 'main',
      },
      targetDefaults: {
        build: {
          cache: true,
        },
        lint: {
          cache: true,
        },
      },
    });
  });
});
