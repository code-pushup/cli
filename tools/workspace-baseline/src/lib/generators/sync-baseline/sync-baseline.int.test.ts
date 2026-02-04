import {
  type Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { syncBaseline } from './sync-baseline.js';

describe('sync-baseline generator integration', () => {
  let tree: Tree;
  const testProjectName = 'test-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, testProjectName, {
      root: testProjectName,
    });
  });

  afterEach(() => {
    tree.delete(testProjectName);
  });

  it('should sync tsconfig for a project', async () => {
    const tsconfigLibPath = path.join(testProjectName, 'tsconfig.lib.json');
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {},
      }),
    );

    const result = await syncBaseline(tree);

    expect(result.outOfSyncMessage).toBeDefined();
    const config = readProjectConfiguration(tree, testProjectName);
    expect(config).toBeDefined();

    const updated = JSON.parse(tree.read(tsconfigLibPath)?.toString() ?? '{}');
    expect(updated.extends).toBe('./tsconfig.base.json');
    expect(updated.compilerOptions?.strict).toBe(true);
    expect(updated.compilerOptions?.noEmit).toBe(true);
  });

  it('should handle projects without tsconfig files', async () => {
    // No tsconfig files created
    const result = await syncBaseline(tree);

    // Should handle gracefully - might throw or return empty
    expect(result).toBeDefined();
  });
});
