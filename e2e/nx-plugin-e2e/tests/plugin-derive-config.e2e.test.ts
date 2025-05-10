import { type Tree, writeJson } from '@nx/devkit';
import path from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';
import { generateCodePushupConfig } from '@code-pushup/nx-plugin';
import {
  generateProject,
  generateWorkspaceAndProject,
  materializeTree,
  nxShowProjectJson,
  nxTargetProject,
  registerPluginInWorkspace,
} from '@code-pushup/test-nx-utils';
import {
  E2E_ENVIRONMENTS_DIR,
  TEST_OUTPUT_DIR,
  teardownTestFolder,
} from '@code-pushup/test-utils';

describe('nx-plugin-derived-config', () => {
  let root: string;
  let tree: Tree;
  const projectName = 'pkg';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'plugin-create-nodes',
  );

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject();
    registerPluginInWorkspace(tree, '@code-pushup/nx-plugin');
    await generateProject(tree, projectName);
    root = readProjectConfiguration(tree, projectName).root;
    generateCodePushupConfig(tree, root);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should derive config from project.json', async () => {
    const cwd = path.join(testFileDir, 'project-config');
    const projectJsonPath = path.join('libs', projectName, 'project.json');
    const packageJsonPath = path.join('libs', projectName, 'package.json');
    tree.delete(projectJsonPath);
    tree.delete(packageJsonPath);
    writeJson(tree, projectJsonPath, {
      root,
      name: projectName,
      targets: {
        'code-pushup': {
          executor: `@code-pushup/nx-plugin:cli`,
          options: {
            'persist.filename': 'my-report',
          },
        },
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectName);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.objectContaining({
        'code-pushup': {
          configurations: {},
          executor: `@code-pushup/nx-plugin:cli`,
          options: {
            'persist.filename': 'my-report',
          },
          parallelism: true,
        },
      }),
    );
  });

  it('should derive config from package.json', async () => {
    const cwd = path.join(testFileDir, 'package-config');
    const projectJsonPath = path.join('libs', projectName, 'project.json');
    const packageJsonPath = path.join('libs', projectName, 'package.json');
    tree.delete(projectJsonPath);
    tree.delete(packageJsonPath);
    writeJson(tree, packageJsonPath, {
      name: `@code-pushup/${projectName}`,
      nx: {
        root,
        name: projectName,
        targets: {
          'code-pushup': {
            executor: `@code-pushup/nx-plugin:cli`,
            options: {
              'persist.filename': 'my-report',
            },
          },
        },
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectName);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.objectContaining({
        'code-pushup': {
          configurations: {},
          executor: `@code-pushup/nx-plugin:cli`,
          options: {
            'persist.filename': 'my-report',
          },
          parallelism: true,
        },
      }),
    );
  });

  it('should derive config from mixed', async () => {
    const cwd = path.join(testFileDir, 'mixed-config');
    const projectJsonPath = path.join('libs', projectName, 'project.json');
    const packageJsonPath = path.join('libs', projectName, 'package.json');

    writeJson(tree, projectJsonPath, {
      root,
      name: projectName,
      targets: {
        'code-pushup': {
          executor: `@code-pushup/nx-plugin:cli`,
          options: {
            'persist.filename': 'my-report',
          },
        },
      },
    });
    writeJson(tree, packageJsonPath, {
      name: `@code-pushup/${projectName}`,
      nx: {
        root,
        name: projectName,
        targets: {
          'code-pushup': {
            executor: `@code-pushup/nx-plugin:cli`,
            options: {
              'persist.outputPath': 'my-dir',
            },
          },
        },
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectName);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.objectContaining({
        'code-pushup': {
          configurations: {},
          executor: `@code-pushup/nx-plugin:cli`,
          options: {
            'persist.filename': 'my-report',
            'persist.outputPath': 'my-dir',
          },
          parallelism: true,
        },
      }),
    );
  });
});
