/* eslint-disable @nx/enforce-module-boundaries */
import 'dotenv/config';
import { z } from 'zod';
import type {
  CategoryConfig,
  CoreConfig,
  PersistConfig,
  PluginConfig,
  UploadConfig,
} from './packages/models/src/index.js';
import coveragePlugin, {
  getNxCoveragePaths,
} from './packages/plugin-coverage/src/index.js';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from './packages/plugin-eslint/src/index.js';
import jsPackagesPlugin from './packages/plugin-js-packages/src/index.js';
import jsDocsPlugin from './packages/plugin-jsdocs/src/index.js';
import type { JsDocsPluginTransformedConfig } from './packages/plugin-jsdocs/src/lib/config.js';
import {
  PLUGIN_SLUG,
  groups,
} from './packages/plugin-jsdocs/src/lib/constants.js';
import { filterGroupsByOnlyAudits } from './packages/plugin-jsdocs/src/lib/utils.js';
import lighthousePlugin, {
  type LighthouseUrls,
  lighthouseGroupRef,
  mergeLighthouseCategories,
} from './packages/plugin-lighthouse/src/index.js';
import typescriptPlugin, {
  type TypescriptPluginOptions,
  getCategories,
} from './packages/plugin-typescript/src/index.js';

/**
 * Helper function to load and validate Code PushUp environment variables for upload configuration
 */
export async function loadEnv(
  projectName: string | undefined = process.env.NX_TASK_TARGET_PROJECT,
): Promise<Partial<CoreConfig>> {
  if (projectName == null || projectName === '') {
    throw new Error(
      'loadEnv failed! Project name is not defined. Please run code pushup fit Nx or provide a projectName.',
    );
  }
  const envSchema = z.object({
    CP_SERVER: z.string().url(),
    CP_API_KEY: z.string().min(1),
    CP_ORGANIZATION: z.string().min(1),
    CP_PROJECT: z.string().optional(),
  });

  const { data: env, success } = await envSchema.safeParseAsync(process.env);

  if (!success || !env) {
    return {};
  }
  const uploadConfig = {
    apiKey: env.CP_API_KEY,
    server: env.CP_SERVER,
    organization: env.CP_ORGANIZATION,
    ...(env.CP_PROJECT
      ? { project: env.CP_PROJECT }
      : { project: projectName }),
  };
  return uploadConfig.apiKey ? { upload: uploadConfig } : {};
}

/**
 * Common exclusion patterns for JSDoc coverage
 */
export const jsDocsExclusionPatterns = [
  '!packages/**/node_modules',
  '!packages/**/{mocks,mock}',
  '!**/*.{spec,test}.ts',
  '!**/implementation/**',
  '!**/internal/**',
];

export const jsPackagesCategories: CategoryConfig[] = [
  {
    slug: 'security',
    title: 'Security',
    description: 'Finds known **vulnerabilities** in 3rd-party packages.',
    refs: [
      {
        type: 'group',
        plugin: 'js-packages',
        slug: 'npm-audit',
        weight: 1,
      },
    ],
  },
  {
    slug: 'updates',
    title: 'Updates',
    description: 'Finds **outdated** 3rd-party packages.',
    refs: [
      {
        type: 'group',
        plugin: 'js-packages',
        slug: 'npm-outdated',
        weight: 1,
      },
    ],
  },
];

export const lighthouseCategories: CategoryConfig[] = [
  {
    slug: 'performance',
    title: 'Performance',
    refs: [lighthouseGroupRef('performance')],
  },
  {
    slug: 'a11y',
    title: 'Accessibility',
    refs: [lighthouseGroupRef('accessibility')],
  },
  {
    slug: 'best-practices',
    title: 'Best Practices',
    refs: [lighthouseGroupRef('best-practices')],
  },
  {
    slug: 'seo',
    title: 'SEO',
    refs: [lighthouseGroupRef('seo')],
  },
];

export const eslintCategories: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Lint rules that find **potential bugs** in your code.',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
  },
  {
    slug: 'code-style',
    title: 'Code style',
    description:
      'Lint rules that promote **good practices** and consistency in your code.',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 }],
  },
];

export function getJsDocsCategories(
  config: JsDocsPluginTransformedConfig,
): CategoryConfig[] {
  return [
    {
      slug: 'docs',
      title: 'Documentation',
      description: 'Measures how much of your code is **documented**.',
      refs: filterGroupsByOnlyAudits(groups, config).map(group => ({
        weight: 1,
        type: 'group',
        plugin: PLUGIN_SLUG,
        slug: group.slug,
      })),
    },
  ];
}

export const coverageCategories: CategoryConfig[] = [
  {
    slug: 'code-coverage',
    title: 'Code coverage',
    description: 'Measures how much of your code is **covered by tests**.',
    refs: [
      {
        type: 'group',
        plugin: 'coverage',
        slug: 'coverage',
        weight: 1,
      },
    ],
  },
];

export const jsPackagesCoreConfig = async (
  packageJsonPath?: string,
): Promise<CoreConfig> => ({
  plugins: [
    await jsPackagesPlugin(packageJsonPath ? { packageJsonPath } : undefined),
  ],
  categories: jsPackagesCategories,
});

export const lighthouseCoreConfig = async (
  urls: LighthouseUrls,
): Promise<CoreConfig> => {
  const lhPlugin = await lighthousePlugin(urls, {
    onlyAudits: ['largest-contentful-paint'],
  });
  return {
    plugins: [lhPlugin],
    categories: mergeLighthouseCategories(lhPlugin, lighthouseCategories),
  };
};

export const jsDocsCoreConfig = (
  config: JsDocsPluginTransformedConfig | string[],
): CoreConfig => ({
  plugins: [
    jsDocsPlugin(Array.isArray(config) ? { patterns: config } : config),
  ],
  categories: getJsDocsCategories(
    Array.isArray(config) ? { patterns: config } : config,
  ),
});

export const eslintCoreConfigNx = async (
  projectName?: string,
): Promise<CoreConfig> => ({
  plugins: [
    projectName
      ? await eslintPlugin({
          eslintrc: `packages/${projectName}/eslint.config.js`,
          patterns: ['.'],
        })
      : await eslintPlugin(await eslintConfigFromAllNxProjects()),
  ],
  categories: eslintCategories,
});

export const typescriptPluginConfig = async (
  options?: TypescriptPluginOptions,
): Promise<CoreConfig> => ({
  plugins: [await typescriptPlugin(options)],
  categories: getCategories(),
});

/**
 * Generates coverage configuration for Nx projects. Supports both single projects and all projects.
 */
export const coverageCoreConfigNx = async (
  projectName?: string,
): Promise<CoreConfig> => {
  const targetNames = ['unit-test', 'int-test'];
  const targetArgs = ['-t', ...targetNames];
  return {
    plugins: [
      await coveragePlugin({
        coverageToolCommand: {
          command: 'npx',
          args: projectName
            ? ['nx', 'run-many', '-p', projectName, ...targetArgs]
            : ['nx', 'run-many', ...targetArgs],
        },
        reports: projectName
          ? targetNames.map(target => ({
              pathToProject: `packages/${projectName}`,
              resultsPath: `coverage/${projectName}/${target}s/lcov.info`,
            }))
          : await getNxCoveragePaths({ targets: targetNames }),
      }),
    ],
    categories: coverageCategories,
  };
};

export function mergeConfigs(
  config: CoreConfig,
  ...configs: Partial<CoreConfig>[]
): CoreConfig {
  return configs.reduce<CoreConfig>(
    (acc, obj) => ({
      ...acc,
      ...mergeCategories(acc.categories, obj.categories),
      ...mergePlugins(acc.plugins, obj.plugins),
      ...mergePersist(acc.persist, obj.persist),
      ...mergeUpload(acc.upload, obj.upload),
    }),
    config,
  );
}

function mergeCategories(
  a: CategoryConfig[] | undefined,
  b: CategoryConfig[] | undefined,
): Pick<CoreConfig, 'categories'> {
  if (!a && !b) {
    return {};
  }

  const mergedMap = new Map<string, CategoryConfig>();

  const addToMap = (categories: CategoryConfig[]) => {
    categories.forEach(newObject => {
      if (mergedMap.has(newObject.slug)) {
        const existingObject: CategoryConfig | undefined = mergedMap.get(
          newObject.slug,
        );

        mergedMap.set(newObject.slug, {
          ...existingObject,
          ...newObject,

          refs: mergeByUniqueCategoryRefCombination(
            existingObject?.refs,
            newObject.refs,
          ),
        });
      } else {
        mergedMap.set(newObject.slug, newObject);
      }
    });
  };

  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  // Convert the map back to an array
  return { categories: [...mergedMap.values()] };
}

function mergePlugins(
  a: PluginConfig[] | undefined,
  b: PluginConfig[] | undefined,
): Pick<CoreConfig, 'plugins'> {
  if (!a && !b) {
    return { plugins: [] };
  }

  const mergedMap = new Map<string, PluginConfig>();

  const addToMap = (plugins: PluginConfig[]) => {
    plugins.forEach(newObject => {
      mergedMap.set(newObject.slug, newObject);
    });
  };

  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return { plugins: [...mergedMap.values()] };
}

function mergePersist(
  a: PersistConfig | undefined,
  b: PersistConfig | undefined,
): Pick<CoreConfig, 'persist'> {
  if (!a && !b) {
    return {};
  }

  if (a) {
    return b ? { persist: { ...a, ...b } } : {};
  } else {
    return { persist: b };
  }
}

function mergeByUniqueCategoryRefCombination<
  T extends { slug: string; type: string; plugin: string },
>(a: T[] | undefined, b: T[] | undefined) {
  const map = new Map<string, T>();

  const addToMap = (refs: T[]) => {
    refs.forEach(ref => {
      const uniqueIdentification = `${ref.type}:${ref.plugin}:${ref.slug}`;
      if (map.has(uniqueIdentification)) {
        map.set(uniqueIdentification, {
          ...map.get(uniqueIdentification),
          ...ref,
        });
      } else {
        map.set(uniqueIdentification, ref);
      }
    });
  };

  // Add objects from both arrays to the map
  if (a) {
    addToMap(a);
  }
  if (b) {
    addToMap(b);
  }

  return [...map.values()];
}

function mergeUpload(
  a: UploadConfig | undefined,
  b: UploadConfig | undefined,
): Pick<CoreConfig, 'upload'> {
  if (!a && !b) {
    return {};
  }

  if (a) {
    return b ? { upload: { ...a, ...b } } : {};
  } else {
    return { upload: b };
  }
}
