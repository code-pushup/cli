import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addToProjectGenerator } from './generator';

describe('init generator', () => {
  let tree: Tree;
  const testProjectName = 'test-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    addProjectConfiguration(tree, testProjectName, {
      root: testProjectName,
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

    expect(tree.exists('test-app/code-pushup.config.ts')).toBe(true);
    expect(projectConfiguration.targets?.['code-pushup']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `code-pushup autorun --no-progress --config=${join(
          './',
          projectConfiguration.root,
          'code-pushup.config.ts',
        )}`,
      },
    });
    expect(
      tree.read('test-app/code-pushup.config.ts')?.toString(),
    ).toMatchSnapshot();
  });

  it('should skip code-pushup.config.ts generation if config fin in ts, mjs or js format already exists', async () => {
    tree.write(join('code-pushup.config.js'), 'export default {}');
    await configurationGenerator(tree, { project: testProjectName });

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(tree.exists('code-pushup.config.ts')).toBe(false);

    expect(projectConfiguration.targets?.['code-pushup']).toEqual({
      executor: 'nx:run-commands',
      options: {
        command: `code-pushup autorun --no-progress --config=${join(
          './',
          projectConfiguration.root,
          'code-pushup.config.ts',
        )}`,
      },
    });
  });
});
