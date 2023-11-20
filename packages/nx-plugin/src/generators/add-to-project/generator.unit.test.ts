import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { join } from 'path';
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

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(tree.exists('apps/test-app/code-pushup.config.json')).toBe(true);
    expect(projectConfiguration.targets?.collect).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `code-pushup collect --no-progress --config=${join(
          './',
          projectConfiguration.root,
          'code-pushup.config.json',
        )}`,
      },
    });
  });
});
