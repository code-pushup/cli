import { Tree, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { SyncBaselineGeneratorSchema } from './schema';
import { syncBaselineGenerator } from './sync-baseline';

describe('sync-baseline generator', () => {
  let tree: Tree;
  const options: SyncBaselineGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await syncBaselineGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
