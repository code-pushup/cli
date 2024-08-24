import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
  nxShowProjectJson,
  registerPluginInWorkspace,
} from '@code-pushup/test-nx-utils';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readTextFile } from '@code-pushup/utils';

// @TODO replace with default bin after https://github.com/code-pushup/cli/issues/643
export function relativePathToCwd(testDir: string): string {
  return relative(join(process.cwd(), testDir), process.cwd());
}

describe('nx-plugin', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = join('libs', project);
  const baseDir = 'tmp/nx-plugin-e2e/plugin';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await rm(baseDir, { recursive: true, force: true });
  });

  it('should add configuration target dynamically', async () => {
    const cwd = join(baseDir, 'add-configuration-dynamically');
    registerPluginInWorkspace(
      tree,
      join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
    );
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: {
        configurations: {}, // @TODO understand why this appears. should not be here
        executor: 'nx:run-commands',
        options: {
          command: `nx g @code-pushup/nx-plugin:configuration --skipTarget --targetName="code-pushup" --project="${project}"`,
        },
      },
    });

    expect(projectJson).toMatchSnapshot();
  });

  it('should execute dynamic configuration target', async () => {
    const cwd = join(baseDir, 'execute-dynamic-configuration');
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        bin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      },
    });
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup--configuration`],
      cwd,
    });

    expect(code).toBe(0);

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      `>  NX   Successfully ran target code-pushup--configuration for project ${project}`,
    );
    await expect(
      readTextFile(join(cwd, projectRoot, 'code-pushup.config.ts')),
    ).resolves.toMatchSnapshot();
  });

  it('should consider plugin option targetName in configuration target', async () => {
    const cwd = join(baseDir, 'configuration-option-target-name');
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        targetName: 'cp',
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['cp--configuration']: expect.any(Object),
    });
  });

  it('should consider plugin option bin in configuration target', async () => {
    const cwd = join(baseDir, 'configuration-option-bin');
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        bin: 'XYZ',
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: expect.objectContaining({
        options: {
          command: `nx g XYZ:configuration --skipTarget --targetName="code-pushup" --project="${project}"`,
        },
      }),
    });
  });

  it('should NOT add config targets dynamically if the project is configured', async () => {
    const cwd = join(baseDir, 'configuration-already-configured');
    registerPluginInWorkspace(
      tree,
      join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
    );
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        ['code-pushup--configuration']: expect.any(Object),
      }),
    );
    expect(projectJson).toMatchSnapshot();
  });

  it('should add executor target dynamically if the project is configured', async () => {
    const cwd = join(baseDir, 'add-executor-dynamically');
    registerPluginInWorkspace(
      tree,
      join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
    );
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup']: {
        configurations: {},
        executor: `@code-pushup/nx-plugin:command`,
        options: {},
      },
    });

    expect(projectJson).toMatchSnapshot();
  });

  it('should execute dynamic executor target', async () => {
    const cwd = join(baseDir, 'execute-dynamic-executor');
    const pathRelativeToPackage = relative(join(cwd, 'libs', project), cwd);
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        bin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
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
      upload: {
        server: 'http://staging.code-pushup.dev',
        organization: 'code-pushup',
        apiKey: '12345678',
      },
    });

    await materializeTree(tree, cwd);

    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun'],
      cwd,
    });

    const cleanStderr = removeColorCodes(stderr);
    // @TODO create test environment for working plugin. This here misses package-lock.json to execute correctly
    expect(cleanStderr).toContain('DryRun execution of: npx @code-pushup/cli');

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      'NX   Successfully ran target code-pushup for project my-lib',
    );
  });

  it('should consider plugin option bin in executor target', async () => {
    const cwd = join(baseDir, 'configuration-option-bin');
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        bin: 'XYZ',
      },
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup']: expect.objectContaining({
        executor: 'XYZ:command',
      }),
    });
  });

  it('should consider plugin option projectPrefix in executor target', async () => {
    const cwd = join(baseDir, 'configuration-option-bin');
    registerPluginInWorkspace(tree, {
      plugin: join(relativePathToCwd(cwd), 'dist/packages/nx-plugin'),
      options: {
        projectPrefix: 'cli',
      },
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup']: expect.objectContaining({
        executor: `@code-pushup/nx-plugin:autorun`,
        options: {
          projectPrefix: 'cli',
        },
      }),
    });
  });

  it('should NOT add targets dynamically if plugin is not registered', async () => {
    const cwd = join(baseDir, 'plugin-not-registered');
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({});
  });
});
