import { type Tree, updateProjectConfiguration } from '@nx/devkit';
import { join, relative } from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

function relativePathToCwd(testDir: string): string {
  return relative(join(process.cwd(), testDir), process.cwd());
}

async function addTargetToWorkspace(
  tree: Tree,
  options: { cwd: string; project: string },
) {
  const { cwd, project } = options;
  const pathRelativeToPackage = relative(join(cwd, 'libs', project), cwd);
  const projectCfg = readProjectConfiguration(tree, project);
  updateProjectConfiguration(tree, project, {
    ...projectCfg,
    targets: {
      ...projectCfg.targets,
      ['code-pushup']: {
        executor: '@code-pushup/nx-plugin:cli',
      },
    },
  });
  const { root } = projectCfg;
  generateCodePushupConfig(tree, root, {
    fileImports: `import type {CoreConfig} from "@code-pushup/models";`,
    plugins: [
      {
        // @TODO replace with inline plugin
        fileImports: `import {customPlugin} from "${join(
          relativePathToCwd(cwd),
          pathRelativeToPackage,
          'dist/testing/test-utils',
        )}";`,
        codeStrings: 'customPlugin()',
      },
    ],
    upload: {
      server: 'https://dummy-server.dev',
      organization: 'dummy-organization',
      apiKey: 'dummy-api-key',
      project: 'dummy-project',
    },
  });
  await materializeTree(tree, cwd);
}

describe('executor command', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/e2e/nx-plugin-e2e/__test__/executor/cli';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should execute no specific command by default', async () => {
    const cwd = join(baseDir, 'execute-default-command');
    await addTargetToWorkspace(tree, { cwd, project });
    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup');
  });

  it('should execute print-config executor', async () => {
    const cwd = join(baseDir, 'execute-print-config-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'print-config'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup print-config');

    await expect(() =>
      readJsonFile(join(cwd, '.code-pushup', project, 'report.json')),
    ).rejects.toThrow('');
  });

  it('should execute collect executor and add report to sub folder named by project', async () => {
    const cwd = join(baseDir, 'execute-collect-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'nx',
      args: ['run', `${project}:code-pushup`, 'collect'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup collect');

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

  it('should execute upload executor to throw if no report is present', async () => {
    const cwd = join(baseDir, 'execute-upload-command');
    await addTargetToWorkspace(tree, { cwd, project });

    await expect(
      executeProcess({
        command: 'npx',
        args: ['nx', 'run', `${project}:code-pushup`, 'upload'],
        cwd,
      }),
    ).rejects.toThrow(/report.json/);
  });

  it('should execute autorun executor', async () => {
    const cwd = join(baseDir, 'execute-autorun-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'autorun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup autorun');
    expect(cleanStdout).toContain(
      '>  NX   Successfully ran target code-pushup for project my-lib',
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
