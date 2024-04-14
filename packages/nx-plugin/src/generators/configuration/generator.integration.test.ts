import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { configurationGenerator } from './generator';

describe('configuration generator', () => {
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

  it('should add code-pushup.config.ts to the project root', async () => {
    await configurationGenerator(tree, { project: testProjectName });

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

  it('should NOT add code-pushup.config.ts to the project root if code-pushup.config.js is given', async () => {
    tree.write(join('code-pushup.config.js'), 'export default {}');
    expect(tree.exists('code-pushup.config.js')).toBe(true);

    await configurationGenerator(tree, { project: testProjectName });

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );
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
