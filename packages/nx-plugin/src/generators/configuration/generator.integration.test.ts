import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  addTargetToProject,
  configurationGenerator,
  generateCodePushupConfig,
} from './generator';

describe('generateCodePushupConfig', () => {
  let tree: Tree;
  const testProjectName = 'test-app';
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, testProjectName, {
      root: 'test-app',
    });
  });

  it('should add code-pushup.config.ts to the project root', () => {
    generateCodePushupConfig(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
      },
    );

    expect(tree.exists('test-app/code-pushup.config.ts')).toBe(true);
    expect(
      tree.read('test-app/code-pushup.config.ts')?.toString(),
    ).toMatchSnapshot();
  });

  it('should skip code-pushup.config.ts generation if config in ts, mjs or js format already exists', () => {
    tree.write(join('code-pushup.config.js'), 'export default {}');

    generateCodePushupConfig(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
      },
    );

    expect(tree.exists('code-pushup.config.ts')).toBe(false);
  });

  it('should skip code-pushup.config.ts generation if skipConfig is given', () => {
    generateCodePushupConfig(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
        skipConfig: true,
      },
    );

    expect(tree.exists('code-pushup.config.ts')).toBe(false);
  });
});

describe('addTargetToProject', () => {
  let tree: Tree;
  const testProjectName = 'test-app';
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'test-app', {
      root: 'test-app',
    });
  });
  afterEach(() => {
    //reset tree
    tree.delete(testProjectName);
  });

  it('should generate a project target', () => {
    addTargetToProject(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
      },
    );

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(projectConfiguration.targets?.['code-pushup']).toEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
  });

  it('should use targetName to generate a project target', () => {
    addTargetToProject(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
        targetName: 'cp',
      },
    );

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(projectConfiguration.targets?.['cp']).toEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
  });

  it('should skip target creation if skipTarget is used', () => {
    addTargetToProject(
      tree,
      {
        root: testProjectName,
        projectType: 'library',
        sourceRoot: `${testProjectName}/src`,
        targets: {},
      },
      {
        project: testProjectName,
        skipTarget: true,
      },
    );

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );
    expect(projectConfiguration.targets).toBeUndefined();
  });
});

describe('configurationGenerator', () => {
  let tree: Tree;
  const testProjectName = 'test-app';
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'test-app', {
      root: 'test-app',
    });
  });

  afterEach(() => {
    tree.delete(testProjectName);
  });

  it('should generate a project target and config file', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
    });

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );

    expect(projectConfiguration.targets?.['code-pushup']).toEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
  });
});
