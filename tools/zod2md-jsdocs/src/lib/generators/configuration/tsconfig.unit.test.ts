import type * as devKit from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as path from 'node:path';
import { DEFAULT_ZOD2MD_CONFIG_FILE_NAME } from './constants.js';
import { addZod2MdTransformToTsConfig } from './tsconfig.js';

describe('addZod2MdTransformToTsConfig', () => {
  let tree: devKit.Tree;
  const testProjectName = 'test-app';
  const tsconfigLibPath = path.join(testProjectName, 'tsconfig.lib.json');
  const zod2mdPath = path.join(
    testProjectName,
    DEFAULT_ZOD2MD_CONFIG_FILE_NAME,
  );

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      tsconfigLibPath,
      JSON.stringify({
        compilerOptions: {
          plugins: [
            {
              transform: './tools/zod2md-jsdocs/dist',
              afterDeclarations: true,
              baseUrl: 'http://example.com/docs/test-app-reference.md',
            },
          ],
        },
      }),
    );
    tree.write(
      zod2mdPath,
      `
     export default {
       entry: './src/index.ts',
       output: './docs/api.md',
       title: 'API Documentation',
      };
      `,
    );
  });

  it('should fail on missing tsconfig.json', () => {
    tree.delete(tsconfigLibPath);
    expect(() =>
      addZod2MdTransformToTsConfig(tree, testProjectName, {
        projectName: testProjectName,
        baseUrl: 'http://example.com',
      }),
    ).toThrow('No config tsconfig.json file exists.');
  });

  it('should update tsconfig.lib.json with transform', () => {
    tree.write(
      tsconfigLibPath,
      JSON.stringify({ compilerOptions: { plugins: [] } }),
    );
    addZod2MdTransformToTsConfig(tree, testProjectName, {
      projectName: testProjectName,
      baseUrl: 'http://example.com',
    });
    expect(
      JSON.parse(tree.read(tsconfigLibPath)?.toString() ?? '{}'),
    ).toStrictEqual(
      expect.objectContaining({
        compilerOptions: expect.objectContaining({
          plugins: [
            {
              transform: './tools/zod2md-jsdocs/dist',
              afterDeclarations: true,
              baseUrl: 'http://example.com/docs/test-app-reference.md',
            },
          ],
        }),
      }),
    );
  });

  it('should skip creation if config already configured', () => {
    expect(() =>
      addZod2MdTransformToTsConfig(tree, testProjectName, {
        projectName: testProjectName,
        baseUrl: 'http://example.com',
      }),
    ).not.toThrow();
  });
});
