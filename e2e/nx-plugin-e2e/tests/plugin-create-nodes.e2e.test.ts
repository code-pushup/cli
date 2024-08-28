import type { Tree } from '@nx/devkit';
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
import { teardownTestFolder } from '@code-pushup/test-setup';
import { removeColorCodes } from '@code-pushup/test-utils';
import { executeProcess, readTextFile } from '@code-pushup/utils';

describe('nx-plugin', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = join('libs', project);
  const baseDir = 'tmp/e2e/nx-plugin-e2e/__test__/plugin/create-nodes';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(baseDir);
  });

  it('should add configuration target dynamically', async () => {
    const cwd = join(baseDir, 'add-configuration-dynamically');
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: {
        configurations: {},
        executor: 'nx:run-commands',
        options: {
          command: `nx g @code-pushup/nx-plugin:configuration --skipTarget --targetName="code-pushup" --project="${project}"`,
        },
      },
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should execute dynamic configuration target', async () => {
    const cwd = join(baseDir, 'execute-dynamic-configuration');
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
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
      plugin: '@code-pushup/nx-plugin',
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
      plugin: '@code-pushup/nx-plugin',
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
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
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
    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should add executor target dynamically if the project is configured', async () => {
    const cwd = join(baseDir, 'add-executor-dynamically');
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup']: {
        configurations: {},
        executor: `@code-pushup/nx-plugin:autorun`,
        options: {},
      },
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should execute dynamic executor target', async () => {
    const cwd = join(baseDir, 'execute-dynamic-executor');
    const pathRelativeToPackage = relative(join(cwd, 'libs', project), cwd);
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root, {
      fileImports: `import type {CoreConfig} from "@code-pushup/models";`,
      plugins: [
        {
          // @TODO replace with inline plugin
          fileImports: `import {customPlugin} from "${join(
            relative(join(process.cwd(), cwd), process.cwd()),
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
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun'],
      cwd,
    });

    const cleanStdout = removeColorCodes(stdout);
    expect(cleanStdout).toContain(
      'NX   Successfully ran target code-pushup for project my-lib',
    );
  });

  it('should consider plugin option bin in executor target', async () => {
    const cwd = join(baseDir, 'configuration-option-bin');
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
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
        executor: 'XYZ:autorun',
      }),
    });
  });

  it('should consider plugin option projectPrefix in executor target', async () => {
    const cwd = join(baseDir, 'configuration-option-bin');
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
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
