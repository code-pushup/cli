import type { Tree } from '@nx/devkit';
import path from 'node:path';
import { readProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
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
  teardownTestFolder,
} from '@code-pushup/test-utils';
import { INLINE_PLUGIN } from '../mocks/inline-plugin.js';

describe('nx-plugin pluginsConfig', () => {
  let tree: Tree;
  const project = 'my-lib';
  const testFileDir = path.join(
    E2E_ENVIRONMENTS_DIR,
    nxTargetProject(),
    TEST_OUTPUT_DIR,
    'plugin-plugins-config',
  );

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject(project);
  });

  afterEach(async () => {
    await teardownTestFolder(testFileDir);
  });

  it('should apply pluginsConfig options to executor target', async () => {
    const cwd = path.join(testFileDir, 'plugins-config-applied');
    const binPath = 'packages/cli/src/index.ts';
    const configPath = '{projectRoot}/code-pushup.config.ts';
    const projectPrefix = 'cli';

    // Register plugin with options in the plugins array and pluginsConfig
    registerPluginInWorkspace(
      tree,
      {
        plugin: '@code-pushup/nx-plugin',
        options: {
          config: configPath,
          persist: {
            outputDir: '.code-pushup/{projectName}',
          },
        },
      },
      {
        projectPrefix,
        bin: binPath,
        env: {
          NODE_OPTIONS: '--import tsx',
          TSX_TSCONFIG_PATH: 'tsconfig.base.json',
        },
      },
    );

    const { root } = readProjectConfiguration(tree, project);
    generateCodePushupConfig(tree, root, {
      plugins: [
        {
          fileImports: '',
          codeStrings: INLINE_PLUGIN,
        },
      ],
    });

    await materializeTree(tree, cwd);

    const { code, stderr, projectJson } = await nxShowProjectJson(cwd, project);
    expect(stderr).toBe('');
    expect(code).toBe(0);

    expect(projectJson).toStrictEqual(
      expect.objectContaining({
        targets: expect.objectContaining({
          'code-pushup': expect.objectContaining({
            executor: '@code-pushup/nx-plugin:cli',
            options: expect.objectContaining({
              projectPrefix,
              bin: binPath,
              env: {
                NODE_OPTIONS: '--import tsx',
                TSX_TSCONFIG_PATH: 'tsconfig.base.json',
              },
            }),
          }),
        }),
      }),
    );
  });
});
