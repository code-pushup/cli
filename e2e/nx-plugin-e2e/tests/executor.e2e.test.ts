import { Tree, updateProjectConfiguration } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readJsonFile } from '@code-pushup/utils';

// @TODO replace with default bin after https://github.com/code-pushup/cli/issues/643
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
        executor: `${join(
          relativePathToCwd(cwd),
          'dist/packages/nx-plugin',
        )}:cli`,
      },
    },
  });
  const { root } = projectCfg;
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
    upload: {
      project: 'my-lib',
      server: 'http://staging.code-pushup.dev',
      organization: 'code-pushup',
      apiKey: '12345678',
    },
  });
  await materializeTree(tree, cwd);
}

describe('CLI executor', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/nx-plugin-e2e/executor';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should execute no command by default', async () => {
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

  it('should execute collect executor', async () => {
    const cwd = join(baseDir, 'execute-collect-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'collect'],
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

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'upload', '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup upload');
  });

  it('should execute autorun executor', async () => {
    const cwd = join(baseDir, 'execute-command-command');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, 'autorun', '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup autorun');
  });
});
