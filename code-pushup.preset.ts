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
import lighthousePlugin, {
  lighthouseGroupRef,
} from './packages/plugin-lighthouse/src/index.js';
import {
  type TypescriptPluginOptions,
  typescriptPlugin,
} from './packages/plugin-typescript/src/index.js';
import { getCategoryRefsFromGroups } from './packages/plugin-typescript/src/lib/utils.js';

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

export const jsPackagesCoreConfig = async (): Promise<CoreConfig> => {
  return {
    plugins: [await jsPackagesPlugin()],
    categories: jsPackagesCategories,
  };
};

export const lighthouseCoreConfig = async (
  url: string,
): Promise<CoreConfig> => {
  return {
    plugins: [await lighthousePlugin(url)],
    categories: lighthouseCategories,
  };
};

export const eslintCoreConfigNx = async (
  projectName?: string,
): Promise<CoreConfig> => {
  return {
    plugins: [
      await eslintPlugin(
        await (projectName
          ? eslintConfigFromNxProject(projectName)
          : eslintConfigFromAllNxProjects()),
      ),
    ],
    categories: eslintCategories,
  };
};

export const typescriptPluginConfigNx = async (
  options?: TypescriptPluginOptions,
): Promise<CoreConfig> => {
  return {
    plugins: [await typescriptPlugin(options)],
    categories: [
      {
        slug: 'typescript',
        title: 'Typescript - All Groups',
        refs: await getCategoryRefsFromGroups(options),
      },
      {
        slug: 'bug-prevention',
        title: 'Bug prevention',
        refs: await getCategoryRefsFromGroups({
          onlyAudits: [
            'syntax-errors',
            'semantic-errors',
            'internal-errors',
            'configuration-errors',
          ],
        }),
      },
      {
        slug: 'code-style',
        title: 'Code style',
        description:
          'TypeScript & Lint rules that promote **good practices** and consistency in your code.',
        refs: await getCategoryRefsFromGroups({ onlyAudits: ['suggestions'] }),
      },
      {
        slug: 'miscellaneous',
        title: 'Miscellaneous',
        description:
          'Errors that do not bring any specific value to the developer, but are still useful to know.',
        refs: await getCategoryRefsFromGroups({
          onlyAudits: ['unknown-codes', 'language-service-errors'],
        }),
      },
    ],
  };
};

export const coverageCoreConfigNx = async (
  projectName?: string,
): Promise<CoreConfig> => {
  if (projectName) {
    throw new Error('coverageCoreConfigNx for single projects not implemented');
  }
  const targetNames = ['unit-test', 'integration-test'];
  const targetArgs = [
    '-t',
    'unit-test',
    'integration-test',
    '--coverage.enabled',
    '--skipNxCache',
  ];
  return {
    plugins: [
      await coveragePlugin({
        coverageToolCommand: {
          command: 'npx',
          args: [
            'nx',
            projectName ? `run --project ${projectName}` : 'run-many',
            ...targetArgs,
          ],
        },
        reports: await getNxCoveragePaths(targetNames),
      }),
    ],
    categories: coverageCategories,
  };
};
