import { describe, expect, it } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readNxJson, Tree } from '@nx/devkit';

import { initGenerator } from './generator';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = { skipPackageJson: false };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    expect(Object.keys(readNxJson(tree)?.targetDefaults || {})).not.toContain(
      'code-pushup',
    );
    expect(
      readNxJson(tree)?.tasksRunnerOptions?.default?.options
        ?.cacheableOperations || {},
    ).not.toContain('code-pushup');
    await initGenerator(tree, options);
    expect(Object.keys(readNxJson(tree)?.targetDefaults || {})).toContain(
      'code-pushup',
    );
    expect(
      readNxJson(tree)?.tasksRunnerOptions?.default?.options
        ?.cacheableOperations || {},
    ).toContain('code-pushup');
  });
});
