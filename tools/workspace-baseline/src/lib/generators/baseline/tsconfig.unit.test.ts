import type * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { getFirstExistingTsConfig } from './tsconfig.js';

describe('getFirstExistingTsConfig', () => {
  let tree: devKit.Tree;
  const testProjectRoot = 'test-app';

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should find tsconfig.lib.json when it exists', () => {
    const tsconfigLibPath = path.join(testProjectRoot, 'tsconfig.lib.json');
    tree.write(tsconfigLibPath, JSON.stringify({ extends: './tsconfig.json' }));

    const result = getFirstExistingTsConfig(tree, testProjectRoot);
    expect(result).toBe(tsconfigLibPath);
  });

  it('should find tsconfig.json when lib does not exist', () => {
    const tsconfigPath = path.join(testProjectRoot, 'tsconfig.json');
    tree.write(tsconfigPath, JSON.stringify({}));

    const result = getFirstExistingTsConfig(tree, testProjectRoot);
    expect(result).toBe(tsconfigPath);
  });

  it('should return undefined when no tsconfig files exist', () => {
    const result = getFirstExistingTsConfig(tree, testProjectRoot);
    expect(result).toBeUndefined();
  });

  it('should prioritize specified tsconfigType', () => {
    const tsconfigToolsPath = path.join(testProjectRoot, 'tsconfig.tools.json');
    const tsconfigLibPath = path.join(testProjectRoot, 'tsconfig.lib.json');
    tree.write(tsconfigToolsPath, JSON.stringify({}));
    tree.write(tsconfigLibPath, JSON.stringify({}));

    const result = getFirstExistingTsConfig(tree, testProjectRoot, {
      tsconfigType: 'tools',
    });
    expect(result).toBe(tsconfigToolsPath);
  });

  it('should handle array of tsconfigType', () => {
    const tsconfigTestPath = path.join(testProjectRoot, 'tsconfig.test.json');
    tree.write(tsconfigTestPath, JSON.stringify({}));

    const result = getFirstExistingTsConfig(tree, testProjectRoot, {
      tsconfigType: ['test', 'lib'],
    });
    expect(result).toBe(tsconfigTestPath);
  });
});
