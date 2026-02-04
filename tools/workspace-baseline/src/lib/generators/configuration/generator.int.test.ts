import { type Tree, logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { configurationGenerator } from './generator.js';

describe('configurationGenerator', () => {
  let tree: Tree;
  const loggerInfoSpy = vi.spyOn(logger, 'info');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate tsconfig file with targetName', async () => {
    await configurationGenerator(tree, {
      targetName: 'tools',
      skipFormat: true,
    });
    const tsconfigPath = 'tsconfig.tools.json';
    expect(tree.exists(tsconfigPath)).toBe(true);
    const content = tree.read(tsconfigPath)?.toString();
    expect(content).toBeTruthy();
    const config = JSON.parse(content!);
    expect(config.extends).toBe('./tsconfig.json');
  });

  it('should skip formatting', async () => {
    await configurationGenerator(tree, {
      targetName: 'tools',
      skipFormat: true,
    });
    expect(loggerInfoSpy).toHaveBeenCalledWith('Skip formatting files');
  });

  it('should warn if tsconfig file already exists', async () => {
    const tsconfigPath = 'tsconfig.tools.json';
    tree.write(tsconfigPath, JSON.stringify({ extends: './tsconfig.json' }));
    const loggerWarnSpy = vi.spyOn(logger, 'warn');

    await configurationGenerator(tree, {
      targetName: 'tools',
      skipFormat: true,
    });

    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'No config file created as tsconfig.tools.json already exists.',
    );
  });
});
