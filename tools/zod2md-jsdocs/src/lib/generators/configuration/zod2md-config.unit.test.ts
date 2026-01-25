import * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import stripAnsi from 'strip-ansi';
import { afterEach, describe, expect, it } from 'vitest';
import { formatArrayToLinesOfJsString } from './utils.js';
import { generateZod2MdConfig } from './zod2md-config.js';

describe('generateZod2MdConfig options', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const generateFilesSpy = vi.spyOn(devKit, 'generateFiles');
  const loggerWarnSpy = vi.spyOn(devKit.logger, 'warn');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    devKit.addProjectConfiguration(tree, testProjectName, {
      root: 'test-app',
    });
  });

  afterEach(() => {
    generateFilesSpy.mockReset();
  });

  it('should create zod2md.config.ts with options', () => {
    generateZod2MdConfig(tree, testProjectName, {
      entry: 'test-app/src/main.ts',
      format: 'esm' as const,
      title: 'App Types',
      output: 'test-app/docs/main.md',
    });

    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        entry: 'test-app/src/main.ts',
        format: 'esm',
        title: 'App Types',
        output: 'test-app/docs/main.md',
      }),
    );
  });

  it('should call generateFilesSpy', () => {
    generateZod2MdConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip creation if config already exists', () => {
    tree.write(path.join(testProjectName, 'zod2md.config.js'), '');
    generateZod2MdConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      stripAnsi(
        'No config file created as zod2md.config.js file already exists.',
      ),
    );
  });

  it('should use correct templates', () => {
    generateZod2MdConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(
        path.join(
          'zod2md-jsdocs',
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

  it('should use correct testProjectName', () => {
    generateZod2MdConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      testProjectName,
      expect.any(Object),
    );
  });

  it('should use default options', () => {
    generateZod2MdConfig(tree, testProjectName);
    expect(generateFilesSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      {
        entry: 'test-app/src/index.ts',
        format: 'esm',
        title: 'test-app reference',
        output: 'test-app/docs/test-app-reference.md',
        transformName: undefined,
        tsconfig: 'test-app/tsconfig.lib.json',
      },
    );
  });
});
