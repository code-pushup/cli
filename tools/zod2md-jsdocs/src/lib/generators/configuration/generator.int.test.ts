import {
  type Tree,
  addProjectConfiguration,
  logger,
  readProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { DEFAULT_ZOD2MD_CONFIG_FILE_NAME } from './constants.js';
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
      entry: 'src/index.ts',
      output: 'docs/test-app-reference.md',
      title: 'Test App Reference',
    });
    readProjectConfiguration(tree, testProjectName);
    expect(
      tree.read(
        path.join('libs', testProjectName, DEFAULT_ZOD2MD_CONFIG_FILE_NAME),
      ),
    ).toBeNull();
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip config file creation');
  });
  it('should skip formatting', async () => {
    await configurationGenerator(tree, {
      project: testProjectName,
      skipFormat: true,
      entry: 'src/index.ts',
      output: 'docs/test-app-reference.md',
      title: 'Test App Reference',
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip formatting files');
  });
});
