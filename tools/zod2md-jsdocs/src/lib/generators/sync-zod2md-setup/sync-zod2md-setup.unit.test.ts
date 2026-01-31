import * as devkit from '@nx/devkit';
import { readJson, updateJson } from '@nx/devkit';
import type { NxProjectPackageJsonConfiguration } from 'nx/src/utils/package-json';
import { generateWorkspaceAndProject } from '@code-pushup/test-nx-utils';
import {
  GENERATE_DOCS_TARGET_NAME,
  PATCH_TS_TARGET_NAME,
} from '../../plugin/constants.js';
import { addZod2MdTransformToTsConfig } from '../configuration/tsconfig.js';
import { generateZod2MdConfig } from '../configuration/zod2md-config.js';
import { syncZod2mdSetupGenerator } from './sync-zod2md-setup.js';

describe('sync-zod2md-setup generator', () => {
  const createProjectGraphAsyncSpy = vi.spyOn(
    devkit,
    'createProjectGraphAsync',
  );
  let tree: devkit.Tree;
  const projectName = 'test';
  const projectRoot = `libs/${projectName}`;
  const zod2mdConfigPath = `${projectRoot}/zod2md.config.ts`;
  const projectConfig: NxProjectPackageJsonConfiguration = {
    root: projectRoot,
    targets: {
      build: {
        dependsOn: ['^build', GENERATE_DOCS_TARGET_NAME, PATCH_TS_TARGET_NAME],
      },
      [GENERATE_DOCS_TARGET_NAME]: {
        executor: 'zod2md-jsdocs:zod2md',
        options: {
          config: zod2mdConfigPath,
        },
        outputs: ['{projectRoot}/docs'],
      },
    },
    tags: [],
  };

  beforeEach(async () => {
    tree = await generateWorkspaceAndProject({
      name: 'test',
      directory: projectRoot,
    });
    addZod2MdTransformToTsConfig(tree, projectRoot, {
      projectName,
      baseUrl: 'http://example.com',
    });
    generateZod2MdConfig(tree, projectRoot, {
      entry: `${projectRoot}/src/index.ts`,
      output: `${projectRoot}/docs/test-reference.md`,
      title: 'Test reference',
    });
    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: projectConfig,
        },
      },
      dependencies: {},
    });
    updateJson(tree, `${projectRoot}/project.json`, config => ({
      ...config,
      name: projectName,
      targets: {
        ...projectConfig.targets,
      },
    }));
  });

  it('should pass if missing zod2md.config', async () => {
    tree.delete(zod2mdConfigPath);
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage: undefined,
    });
    expect(tree.exists(zod2mdConfigPath)).toBeFalse();
  });

  it('should fail if missing tsconfig file', async () => {
    tree.delete(`${projectRoot}/tsconfig.json`);
    tree.delete(`${projectRoot}/tsconfig.lib.json`);
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage: expect.stringContaining(`Missing tsconfig in:
  - ${projectRoot}`),
    });
    expect(tree.exists(`${projectRoot}/zod2md.config.ts`)).toBeTrue();
  });

  it('should fail if missing "zod2md" target in project config', async () => {
    updateJson(tree, `${projectRoot}/project.json`, config => ({
      ...config,
      name: projectName,
      targets: {
        build: {
          dependsOn: [
            '^build',
            GENERATE_DOCS_TARGET_NAME,
            PATCH_TS_TARGET_NAME,
          ],
        },
      },
    }));
    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: {
            ...projectConfig,
            targets: {
              build: {
                dependsOn: [
                  '^build',
                  GENERATE_DOCS_TARGET_NAME,
                  PATCH_TS_TARGET_NAME,
                ],
              },
            },
          },
        },
      },
      dependencies: {},
    });
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage:
        expect.stringContaining(`Missing "generate-docs" target in:
  - ${projectRoot}`),
    });
    expect(tree.exists(`${projectRoot}/zod2md.config.ts`)).toBeTrue();
  });

  it('should fail if missing "dependsOn" targets in build target', async () => {
    updateJson(tree, `${projectRoot}/project.json`, config => ({
      ...config,
      name: projectName,
      targets: {
        ...projectConfig.targets,
        build: {
          dependsOn: ['^build'],
        },
      },
    }));
    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: {
            ...projectConfig,
            targets: {
              ...projectConfig.targets,
              build: {
                dependsOn: ['^build'],
              },
            },
          },
        },
      },
      dependencies: {},
    });
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage:
        expect.stringContaining(`Missing build.dependsOn entries:
  - libs/test: generate-docs, ts-patch`),
    });
    expect(tree.exists(`${projectRoot}/zod2md.config.ts`)).toBeTrue();
  });

  it('should fail if missing Zod2Md TypeScript plugin configuration', async () => {
    updateJson(tree, `${projectRoot}/tsconfig.lib.json`, config => ({
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        plugins: [],
      },
    }));
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage:
        expect.stringContaining(`Missing Zod2Md TypeScript plugin configuration in:
  - ${projectRoot}`),
    });
    expect(tree.exists(`${projectRoot}/zod2md.config.ts`)).toBeTrue();
  });

  it('should pass if zod2md setup is correct', async () => {
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage: undefined,
    });
  });

  it('should not duplicate dependencies when they exist as objects', async () => {
    const objectFormDependsOn = [
      '^build',
      {
        target: GENERATE_DOCS_TARGET_NAME,
        projects: 'self',
      },
    ];
    updateJson(tree, `${projectRoot}/project.json`, config => ({
      ...config,
      name: projectName,
      targets: {
        ...projectConfig.targets,
        build: {
          dependsOn: objectFormDependsOn,
        },
      },
    }));
    createProjectGraphAsyncSpy.mockResolvedValue({
      nodes: {
        [projectName]: {
          name: projectName,
          type: 'lib',
          data: {
            ...projectConfig,
            targets: {
              ...projectConfig.targets,
              build: {
                dependsOn: objectFormDependsOn,
              },
            },
          },
        },
      },
      dependencies: {},
    });
    await expect(syncZod2mdSetupGenerator(tree)).resolves.toStrictEqual({
      outOfSyncMessage:
        expect.stringContaining(`Missing build.dependsOn entries:
  - libs/test: ts-patch`),
    });
    const projectJson = readJson(tree, `${projectRoot}/project.json`) as {
      targets?: {
        build?: {
          dependsOn?: unknown[];
        };
      };
    };
    const dependsOn = projectJson.targets?.build?.dependsOn ?? [];
    const generateDocsCount = dependsOn.filter(
      dep =>
        dep === GENERATE_DOCS_TARGET_NAME ||
        (typeof dep === 'object' &&
          dep != null &&
          'target' in dep &&
          dep.target === GENERATE_DOCS_TARGET_NAME),
    ).length;
    expect(generateDocsCount).toBe(1);
  });
});
