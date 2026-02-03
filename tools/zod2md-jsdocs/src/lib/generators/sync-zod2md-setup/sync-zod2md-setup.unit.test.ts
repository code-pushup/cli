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
import { formatIssues, syncZod2mdSetupGenerator } from './sync-zod2md-setup.js';

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

  describe('formatIssues', () => {
    it('should return undefined for empty issues array', () => {
      expect(formatIssues([])).toBeUndefined();
    });

    it('should format missing tsconfig issues', () => {
      const issues = [
        {
          type: 'missing-tsconfig' as const,
          projectRoot: 'libs/project1',
          data: undefined,
        },
        {
          type: 'missing-tsconfig' as const,
          projectRoot: 'libs/project2',
          data: undefined,
        },
      ];

      expect(formatIssues(issues)).toBe(`Missing tsconfig in:
  - libs/project1
  - libs/project2`);
    });

    it('should format missing target issues', () => {
      const issues = [
        {
          type: 'missing-target' as const,
          projectRoot: 'libs/project1',
          data: { target: 'generate-docs' },
        },
      ];

      expect(formatIssues(issues)).toBe(`Missing "generate-docs" target in:
  - libs/project1`);
    });

    it('should format missing build dependencies issues', () => {
      const issues = [
        {
          type: 'missing-build-depends-on' as const,
          projectRoot: 'libs/project1',
          data: { missing: ['generate-docs', 'ts-patch'] },
        },
        {
          type: 'missing-build-depends-on' as const,
          projectRoot: 'libs/project2',
          data: { missing: ['generate-docs'] },
        },
      ];

      expect(formatIssues(issues)).toBe(`Missing build.dependsOn entries:
  - libs/project1: generate-docs, ts-patch
  - libs/project2: generate-docs`);
    });

    it('should format missing ts plugin issues', () => {
      const issues = [
        {
          type: 'missing-ts-plugin' as const,
          projectRoot: 'libs/project1',
          data: undefined,
        },
      ];

      expect(formatIssues(issues))
        .toBe(`Missing Zod2Md TypeScript plugin configuration in:
  - libs/project1`);
    });

    it('should format multiple issue types', () => {
      const issues = [
        {
          type: 'missing-tsconfig' as const,
          projectRoot: 'libs/project1',
          data: undefined,
        },
        {
          type: 'missing-target' as const,
          projectRoot: 'libs/project2',
          data: { target: 'generate-docs' },
        },
        {
          type: 'missing-build-depends-on' as const,
          projectRoot: 'libs/project3',
          data: { missing: ['generate-docs'] },
        },
        {
          type: 'missing-ts-plugin' as const,
          projectRoot: 'libs/project4',
          data: undefined,
        },
      ];

      const expected = `Missing tsconfig in:
  - libs/project1

Missing "generate-docs" target in:
  - libs/project2

Missing build.dependsOn entries:
  - libs/project3: generate-docs

Missing Zod2Md TypeScript plugin configuration in:
  - libs/project4`;

      expect(formatIssues(issues)).toBe(expected);
    });

    it('should filter out null formatted sections', () => {
      const issues = [
        {
          type: 'missing-tsconfig' as const,
          projectRoot: 'libs/project1',
          data: undefined,
        },
        // No missing-target issues
        // No missing-build-deps issues
        {
          type: 'missing-ts-plugin' as const,
          projectRoot: 'libs/project2',
          data: undefined,
        },
      ];

      const expected = `Missing tsconfig in:
  - libs/project1

Missing Zod2Md TypeScript plugin configuration in:
  - libs/project2`;

      expect(formatIssues(issues)).toBe(expected);
    });
  });
});
