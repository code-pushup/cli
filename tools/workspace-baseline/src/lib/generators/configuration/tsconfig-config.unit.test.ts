import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import stripAnsi from 'strip-ansi';
import { generateTsConfig } from './tsconfig-config.js';

describe('generateTsConfig', () => {
  let tree: devKit.Tree;
  const testProjectRoot = '.';
  const generateFilesSpy = vi.spyOn(devKit, 'generateFiles');
  const loggerWarnSpy = vi.spyOn(devKit.logger, 'warn');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  afterEach(() => {
    generateFilesSpy.mockReset();
  });

  it('should create tsconfig.{targetName}.json with targetName', () => {
    generateTsConfig(tree, testProjectRoot, {
      targetName: 'tools',
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      testProjectRoot,
      expect.objectContaining({
        targetName: 'tools',
      }),
    );
  });

  it('should call generateFiles', () => {
    generateTsConfig(tree, testProjectRoot, {
      targetName: 'lib',
    });
    expect(generateFilesSpy).toHaveBeenCalledOnce();
  });

  it('should skip creation if config already exists', () => {
    tree.write(
      'tsconfig.tools.json',
      JSON.stringify({ extends: './tsconfig.json' }),
    );
    generateTsConfig(tree, testProjectRoot, {
      targetName: 'tools',
    });
    expect(generateFilesSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledOnce();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      stripAnsi(
        'No config file created as tsconfig.tools.json already exists.',
      ),
    );
  });

  it('should use correct template path', () => {
    generateTsConfig(tree, testProjectRoot, {
      targetName: 'tools',
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(
        path.join(
          'workspace-baseline',
          'src',
          'lib',
          'generators',
          'configuration',
          'files',
        ),
      ),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should use custom projectRoot when provided', () => {
    const customRoot = 'packages/my-package';
    generateTsConfig(tree, testProjectRoot, {
      targetName: 'tools',
      projectRoot: customRoot,
    });
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      customRoot,
      expect.any(Object),
    );
  });
});
