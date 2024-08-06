import {
  Tree,
  addProjectConfiguration,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants';
import { addTargetToProject, configurationGenerator } from './generator';

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

    expect(projectConfiguration.targets?.[DEFAULT_TARGET_NAME]).toEqual({
      executor: `${PACKAGE_NAME}:autorun`,
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
      executor: `${PACKAGE_NAME}:autorun`,
    });
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

    expect(projectConfiguration.targets?.[DEFAULT_TARGET_NAME]).toEqual({
      executor: '@code-pushup/nx-plugin:autorun',
    });
    expect(projectConfiguration.targets?.[DEFAULT_TARGET_NAME]).toEqual({
      executor: `${PACKAGE_NAME}:autorun`,
    });
  });

  it('should skip target creation if skipTarget is used', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipTarget: true,
    });

    const projectConfiguration = readProjectConfiguration(
      tree,
      testProjectName,
    );
    expect(projectConfiguration.targets).toBeUndefined();
  });
});
