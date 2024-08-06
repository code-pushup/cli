import {
  Tree,
  addProjectConfiguration,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  const loggerInfoSpy = vi.spyOn(logger, 'info');

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
      executor: `${PACKAGE_NAME}:autorun`,
    });
  });

  it('should skip config creation if skipConfig is used', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipConfig: true,
    });

    readProjectConfiguration(tree, testProjectName);

    expect(
      tree.read(join('libs', testProjectName, 'code-pushup.config.ts')),
    ).toBeNull();
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip config file creation');
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
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip adding target to project');
  });

  it('should skip formatting', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipFormat: true,
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip formatting files');
  });
});
