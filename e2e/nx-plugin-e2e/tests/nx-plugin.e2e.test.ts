import { Tree } from '@nx/devkit';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
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
import { distPluginPackage, pluginFilePath } from '../mocks/utils';

async function executeConfigurationTarger(
  project: string,
  args: string[],
  options: {
    cwd?: string;
    targetName?: string;
  },
) {
  const { cwd } = options;
  return await executeProcess({
    command: 'npx',
    args: ['nx', 'run', `${project}:code-pushup--configuration`, ...args],
    cwd,
  });
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

  it('should execute configuration', async () => {
    const cwd = join(baseDir, 'registered');
    registerPluginInWorkspace(tree, {
      plugin: pluginFilePath(cwd),
      options: {
        // would need to install it over verddaccio
        bin: distPluginPackage(cwd),
      },
    });
    await materializeTree(tree, cwd);

    const { code, stdout } = await executeConfigurationTarger(project, [], {
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

  it('should add config targets dynamically', async () => {
    const cwd = join(baseDir, 'registered');
    registerPluginInWorkspace(tree, pluginFilePath(cwd));
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: {
        configurations: {}, // @TODO understand why this appears. should not be here
        executor: 'nx:run-commands',
        options: {
          command: `nx g @code-pushup/nx-plugin:configuration --project=${project}`,
        },
      },
    });

    expect(projectJson).toMatchSnapshot();
  });

  it('should consider plugin option targetName', async () => {
    const cwd = join(baseDir, 'option-target-name');
    registerPluginInWorkspace(tree, {
      plugin: pluginFilePath(cwd),
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

  it('should consider plugin option bin', async () => {
    const cwd = join(baseDir, 'option-bin');
    registerPluginInWorkspace(tree, {
      plugin: pluginFilePath(cwd),
      options: {
        bin: distPluginPackage(cwd),
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      ['code-pushup--configuration']: {
        configurations: {}, // @TODO understand why this appears. should not be here
        executor: 'nx:run-commands',
        options: {
          command: `nx g ${distPluginPackage(
            cwd,
          )}:configuration --project=${project}`,
        },
      },
    });
  });

  it('should NOT add config targets dynamically if the project is configured', async () => {
    const cwd = join(baseDir, 'already-configured');
    registerPluginInWorkspace(tree, pluginFilePath(cwd));
    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root);
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({});
    expect(projectJson).toMatchSnapshot();
  });

  it('should NOT add config targets dynamically if plugin is not registered', async () => {
    const cwd = join(baseDir, 'not-registered');
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, project);

    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({});
    expect(projectJson).toMatchSnapshot();
  });
});
