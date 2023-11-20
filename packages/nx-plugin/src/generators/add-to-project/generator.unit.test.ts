import { Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, expect, it } from 'vitest';
import { addToProjectGenerator } from './generator';

describe('init generator', () => {
  let tree: Tree;
  const testProjectName = 'test-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    addProjectConfiguration(tree, testProjectName, {
      root: `apps/${testProjectName}`,
      projectType: 'library',
      sourceRoot: `apps/${testProjectName}/src`,
      targets: {},
    });
  });

  it('should add code-pushuo.config.json to the project root', async () => {
    await addToProjectGenerator(tree, { project: testProjectName });

    expect(tree.exists('apps/test-app/code-pushup.config.json')).toBe(true);
  });
});
