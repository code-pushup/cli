/* eslint-disable @nx/enforce-module-boundaries */
import type {
  CategoryConfig,
  CoreConfig,
} from './packages/models/src/index.js';
import coveragePlugin, {
  getNxCoveragePaths,
} from './packages/plugin-coverage/src/index.js';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from './packages/plugin-eslint/src/index.js';
import jsPackagesPlugin from './packages/plugin-js-packages/src/index.js';
import jsDocsPlugin, {
  JsDocsPluginConfig,
} from './packages/plugin-jsdocs/src/index.js';
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
  config: JsDocsPluginConfig,
): CategoryConfig[] {
  const filterOptions =
    typeof config === 'string' || Array.isArray(config)
      ? {}
      : { onlyAudits: config.onlyAudits, skipAudits: config.skipAudits };
  return [
    {
      slug: 'docs',
      title: 'Documentation',
      description: 'Measures how much of your code is **documented**.',
      refs: filterGroupsByOnlyAudits(groups, filterOptions).map(group => ({
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

export const jsPackagesCoreConfig = async (): Promise<CoreConfig> => ({
  plugins: [await jsPackagesPlugin()],
  categories: jsPackagesCategories,
});

export const lighthouseCoreConfig = async (
  urls: LighthouseUrls,
): Promise<CoreConfig> => {
  const lhPlugin = await lighthousePlugin(urls);
  return {
    plugins: [lhPlugin],
    categories: mergeLighthouseCategories(lhPlugin, lighthouseCategories),
  };
};

export const jsDocsCoreConfig = (
  config: JsDocsPluginConfig | string[],
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
  options?: { exclude?: string[] },
): Promise<CoreConfig> => ({
  plugins: [
    await eslintPlugin(
      await (projectName
        ? eslintConfigFromNxProject(projectName)
        : eslintConfigFromAllNxProjects(options)),
    ),
  ],
  categories: eslintCategories,
});

export const typescriptPluginConfig = async (
  options?: TypescriptPluginOptions,
): Promise<CoreConfig> => ({
  plugins: [await typescriptPlugin(options)],
  categories: getCategories(),
});

export const coverageCoreConfigNx = async (
  projectOrConfig?:
    | string
    | {
        projectName: string;
        targetNames: string[];
      },
  options?: { exclude?: string[] },
): Promise<CoreConfig> => {
  const projectName =
    typeof projectOrConfig === 'string'
      ? projectOrConfig
      : projectOrConfig?.projectName;
  const targetNames =
    typeof projectOrConfig === 'object' && projectOrConfig?.targetNames?.length
      ? projectOrConfig.targetNames
      : ['unit-test', 'int-test'];

  if (projectName) {
    throw new Error('coverageCoreConfigNx for single projects not implemented');
  }

  const targetArgs = ['-t', ...targetNames];

  // Compute projects list and apply exclude for efficient run-many execution
  const { createProjectGraphAsync } = await import('@nx/devkit');
  const { nodes } = await createProjectGraphAsync({ exitOnError: false });
  const projectsWithTargets = Object.values(nodes).filter(node =>
    targetNames.some(t => node.data.targets && t in node.data.targets),
  );
  const filteredProjects = options?.exclude?.length
    ? projectsWithTargets.filter(node => !options.exclude!.includes(node.name))
    : projectsWithTargets;
  const projectsArg = `--projects=${filteredProjects
    .map(p => p.name)
    .join(',')}`;

  return {
    plugins: [
      await coveragePlugin({
        coverageToolCommand: {
          command: 'npx',
          args: [
            'nx',
            projectName ? `run --project ${projectName}` : 'run-many',
            ...targetArgs,
            projectsArg,
          ],
        },
        reports: await getNxCoveragePaths(targetNames, false, options?.exclude),
      }),
    ],
    categories: coverageCategories,
  };
};
