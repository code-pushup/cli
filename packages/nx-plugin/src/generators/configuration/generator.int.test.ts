import {
  type Tree,
  addProjectConfiguration,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TARGET_NAME, PACKAGE_NAME } from '../../internal/constants.js';
import { configurationGenerator } from './generator.js';

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

  it('should skip config creation if skipConfig is used', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipConfig: true,
    });

    readProjectConfiguration(tree, testProjectName);

    expect(
      tree.read(path.join('libs', testProjectName, 'code-pushup.config.ts')),
    ).toBeNull();
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip config file creation');
  });

  it('should skip formatting', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipFormat: true,
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip formatting files');
  });
});
