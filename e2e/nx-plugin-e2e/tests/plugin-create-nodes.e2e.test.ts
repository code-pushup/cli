import type { Tree } from '@nx/devkit';
import path from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateWorkspaceAndProject,
  materializeTree,
  nxShowProjectJson,
  nxTargetProject,
  registerPluginInWorkspace,
} from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  removeColorCodes,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { executeProcess, readTextFile } from '@code-pushup/utils';
import { INLINE_PLUGIN } from '../mocks/inline-plugin.js';

describe('nx-plugin', () => {
  let tree: Tree;
  const project = 'my-lib';
  const projectRoot = path.join('libs', project);
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'plugin-create-nodes',
  );
  const PACKAGE_NAME = '@code-pushup/nx-plugin';

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should add configuration target dynamically', async () => {
    const cwd = path.join(testFileDir, 'add-configuration-dynamically');
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toEqual({
      'code-pushup--configuration': {
        configurations: {},
        executor: 'nx:run-commands',
        options: {
          command: `nx g @code-pushup/nx-plugin:configuration --project="${project}"`,
        },
        parallelism: true,
      },
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should execute dynamic configuration target', async () => {
    const cwd = path.join(testFileDir, 'execute-dynamic-configuration');
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
      `Successfully ran target code-pushup--configuration for project ${project}`,
    );
    await expect(
      readTextFile(path.join(cwd, projectRoot, 'code-pushup.config.ts')),
    ).resolves.toMatchSnapshot();
  });

  it('should consider plugin option targetName in configuration target', async () => {
    const cwd = path.join(testFileDir, 'configuration-option-target-name');
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
      'cp--configuration': expect.any(Object),
    });
  });

  it('should consider plugin option bin in configuration target', async () => {
    const cwd = path.join(testFileDir, 'configuration-option-bin');
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
      'code-pushup--configuration': expect.objectContaining({
        options: {
          command: `nx g ${PACKAGE_NAME}:configuration --project="${project}"`,
        },
      }),
    });
  });

  it('should NOT add config targets dynamically if the project is configured', async () => {
    const cwd = path.join(testFileDir, 'configuration-already-configured');
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        'code-pushup--configuration': expect.any(Object),
      }),
    );
    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should add executor target dynamically if the project is configured', async () => {
    const cwd = path.join(testFileDir, 'add-executor-dynamically');
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      'code-pushup': {
        configurations: {},
        executor: `@code-pushup/nx-plugin:cli`,
        options: {},
        parallelism: true,
      },
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should execute dynamic executor target', async () => {
    const cwd = path.join(testFileDir, 'execute-dynamic-executor');
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root, {
      plugins: [
        {
          fileImports: '',
          codeStrings: INLINE_PLUGIN,
        },
      ],
      upload: {
        server: 'https://api.staging.code-pushup.dev/graphql',
        organization: 'code-pushup',
        apiKey: 'cp_12345678',
      },
    });

    await materializeTree(tree, cwd);

    const { stdout } = await executeProcess({
      command: 'npx',
      args: ['nx', 'run', `${project}:code-pushup`, '--dryRun', '--verbose'],
      cwd,
    });

    const cleanStdout = removeColorCodes(stdout);
    // Nx command
    expect(cleanStdout).toContain('nx run my-lib:code-pushup');
    // Run CLI executor
    expect(cleanStdout).toContain('DryRun execution of:');
    expect(cleanStdout).toContain('npx @code-pushup/cli');
    expect(cleanStdout).toContain('--dryRun');
    expect(cleanStdout).not.toContain('--verbose');
  });

  it('should consider plugin option bin in executor target', async () => {
    const cwd = path.join(testFileDir, 'executor-option-bin');
    const binPath = `packages/cli/dist`;
    registerPluginInWorkspace(tree, {
      plugin: '@code-pushup/nx-plugin',
      options: {
        bin: binPath,
      },
    });
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      'code-pushup': expect.objectContaining({
        options: {
          bin: binPath,
        },
      }),
    });
  });

  it('should consider plugin option projectPrefix in executor target', async () => {
    const cwd = path.join(testFileDir, 'executor-option-projectPrefix');
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
      'code-pushup': expect.objectContaining({
        executor: `@code-pushup/nx-plugin:cli`,
        options: {
          projectPrefix: 'cli',
        },
      }),
    });
  });

  it('should NOT add targets dynamically if plugin is not registered', async () => {
    const cwd = path.join(testFileDir, 'plugin-not-registered');
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({});
  });
});
