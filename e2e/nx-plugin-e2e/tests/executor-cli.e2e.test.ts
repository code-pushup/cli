import { type Tree, updateProjectConfiguration } from '@nx/devkit';
import { join, relative } from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
  nxTargetProject,
} from '@code-pushup/test-nx-utils';
import { teardownTestFolder } from '@code-pushup/test-setup';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  osAgnosticPath,
  removeColorCodes,
} from '@code-pushup/test-utils';
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
        fileImports: `import {customPlugin} from "${osAgnosticPath(
          join(
            relativePathToCwd(cwd),
            pathRelativeToPackage,
            'dist/testing/test-utils',
          ),
        )}";`,
        codeStrings: 'customPlugin()',
      },
    ],
  });
  await materializeTree(tree, cwd);
}

describe('executor command', () => {
  let tree: Tree;
  const project = 'my-lib';
  const testFileDir = join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'executor-cli',
  );

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should execute no specific command by default', async () => {
    const cwd = join(testFileDir, 'execute-default-command');
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
    const cwd = join(testFileDir, 'execute-print-config-command');
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
    const cwd = join(testFileDir, 'execute-collect-command');
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
});
