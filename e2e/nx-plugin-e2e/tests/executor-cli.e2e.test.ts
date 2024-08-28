import {type Tree, updateProjectConfiguration} from '@nx/devkit';
import {rm} from 'node:fs/promises';
import {join, relative} from 'node:path';
import {readProjectConfiguration} from 'nx/src/generators/utils/project-configuration';
import {afterEach, expect} from 'vitest';
import {generateCodePushupConfig} from '@code-pushup/nx-plugin';
import {generateWorkspaceAndProject, materializeTree,} from '@code-pushup/test-nx-utils';
import {removeColorCodes} from '@code-pushup/test-utils';
import {executeProcess} from '@code-pushup/utils';

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
        executor: '@code-pushup/nx-plugin:autorun',
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
  });
  await materializeTree(tree, cwd);
}

describe('executor autorun', () => {
  let tree: Tree;
  const project = 'my-lib';
  const baseDir = 'tmp/e2e/nx-plugin-e2e/__test__/executor/cli';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject({name: project});
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should execute autorun executor', async () => {
    const cwd = join(baseDir, 'execute-dynamic-executor');
    await addTargetToWorkspace(tree, { cwd, project });

    const { stdout, code } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun'],
      cwd,
    });

    expect(code).toBe(0);
    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain('nx run my-lib:code-pushup --dryRun');
  });
});
