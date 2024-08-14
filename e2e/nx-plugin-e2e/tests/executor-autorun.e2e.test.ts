import { Tree, updateProjectConfiguration } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
  registerPluginInWorkspace,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

// @TODO replace with default bin after https://github.com/code-pushup/cli/issues/643
export function relativePathToCwd(testDir: string): string {
  return relative(join(process.cwd(), testDir), process.cwd());
}

describe('executor autorun', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/nx-plugin-e2e/executor';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should execute autorun executor', async () => {
    const cwd = join(baseDir, 'execute-dynamic-executor');
    const pathRelativeToPackage = relative(join(cwd, 'libs', project), cwd);
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        bin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      },
    });
    const projectCfg = readProjectConfiguration(tree, project);
    updateProjectConfiguration(tree, project, {
      ...projectCfg,
      targets: {
        ...projectCfg.targets,
        ['code-pushup']: {
          executor: '@code-pushup/nx-plugin:autorun',
        },
      },
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root, {
      fileImports: `import type {CoreConfig} from "${join(
        relativePathToCwd(cwd),
        pathRelativeToPackage,
        'dist/packages/models',
      )}";`,
      plugins: [
        {
          fileImports: `import {customPlugin} from "${join(
            relativePathToCwd(cwd),
            pathRelativeToPackage,
            'dist/testing/test-utils',
          )}";`,
          codeStrings: 'customPlugin()',
        },
      ],
    });

    await materializeTree(tree, cwd);

    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`],
      cwd,
    });

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      'NX   Successfully ran target code-pushup for project my-lib',
    );

    const report = await readJsonFile(
      join(cwd, '.code-pushup', project, 'report.json'),
    );
    expect(report).toStrictEqual(
      expect.objectContaining({
        plugins: [
          expect.objectContaining({
            slug: 'good-feels',
            audits: [
              expect.objectContaining({
                displayValue: '✅ Perfect! 👌',
                slug: 'always-perfect',
              }),
            ],
          }),
        ],
      }),
    );
  });
});
