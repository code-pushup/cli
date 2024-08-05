import { join } from 'node:path';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { describe, expect, it } from 'vitest';
import { readJsonFile } from '@code-pushup/utils';
import { materializeTree } from './tree';

describe('materializeTree', () => {
  const baseDir = join('tmp', 'materialize-tree');

  it('should create files from tree', async () => {
    const root = join(baseDir, 'materialize');

    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    expect(tree.exists('nx.json')).toBe(true);

    await materializeTree(tree, root);

    await expect(readJsonFile(join(root, 'nx.json'))).resolves.toEqual({
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
