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
      root: `${testProjectName}`,
      projectType: 'library',
      sourceRoot: `${testProjectName}/src`,
      targets: {},
    });
  });

  it('should add code-pushup.config.js to the project root', async () => {
    await addToProjectGenerator(tree, { project: testProjectName });

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(tree.exists('test-app/code-pushup.config.js')).toBe(true);
    expect(projectConfiguration.targets?.['code-pushup']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `code-pushup autorun --no-progress --config=${join(
          './',
          projectConfiguration.root,
          'code-pushup.config.js',
        )}`,
      },
    });
  });
});
