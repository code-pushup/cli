/* eslint-disable @nx/enforce-module-boundaries */
import { createProjectGraphAsync } from '@nx/devkit';
import type {
  CategoryConfig,
  CoreConfig,
  PluginUrls,
} from './packages/models/src/index.js';
import axePlugin, { axeCategories } from './packages/plugin-axe/src/index.js';
import coveragePlugin, {
  type CoveragePluginConfig,
  getNxCoveragePaths,
} from './packages/plugin-coverage/src/index.js';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
} from './packages/plugin-eslint/src/index.js';
import jsPackagesPlugin from './packages/plugin-js-packages/src/index.js';
import jsDocsPlugin from './packages/plugin-jsdocs/src/index.js';
import {
  lighthouseCategories,
  lighthouseGroupRef,
  lighthousePlugin,
} from './packages/plugin-lighthouse/src/index.js';
import typescriptPlugin, {
  getCategories,
} from './packages/plugin-typescript/src/index.js';
import { profiler } from './packages/utils/src/index.js';

export function configureUpload(projectName: string = 'workspace'): CoreConfig {
  return profiler.measure(
    'preset:configure-upload',
    () => ({
      ...(process.env['CP_API_KEY'] && {
        upload: {
          server: 'https://api.staging.code-pushup.dev/graphql',
          apiKey: process.env['CP_API_KEY'],
          organization: 'code-pushup',
          project: `cli-${projectName}`,
        },
      }),
      plugins: [],
    }),
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Project', projectName],
          ['Upload enabled', String(!!config.upload)],
        ],
        tooltipText: `Configured upload preset for ${projectName}`,
      }),
    },
  );
}

export async function configureEslintPlugin(
  projectName?: string,
): Promise<CoreConfig> {
  return profiler.measureAsync(
    'preset:configure-plugin-eslint',
    async () => {
      return {
        plugins: [
          projectName
            ? await eslintPlugin(
                {
                  eslintrc: `packages/${projectName}/eslint.config.js`,
                  patterns: ['.'],
                },
                {
                  artifacts: {
                    // We leverage Nx dependsOn to only run all lint targets before we run code-pushup
                    // generateArtifactsCommand: 'npx nx run-many -t lint',
                    artifactsPaths: [
                      `packages/${projectName}/.eslint/eslint-report.json`,
                    ],
                  },
                },
              )
            : await eslintPlugin(await eslintConfigFromAllNxProjects()),
        ],
        categories: [
          {
            slug: 'bug-prevention',
            title: 'Bug prevention',
            description:
              'Lint rules that find **potential bugs** in your code.',
            refs: [
              { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
            ],
          },
          {
            slug: 'code-style',
            title: 'Code style',
            description:
              'Lint rules that promote **good practices** and consistency in your code.',
            refs: [
              {
                type: 'group',
                plugin: 'eslint',
                slug: 'suggestions',
                weight: 1,
              },
            ],
          },
        ],
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Project', projectName || 'all'],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured ESLint plugin preset for ${projectName || 'all projects'}`,
      }),
    },
  );
}

export async function configureCoveragePlugin(
  projectName?: string,
): Promise<CoreConfig> {
  return profiler.measureAsync(
    'preset:configure-plugin-coverage',
    async () => {
      const targets = ['unit-test', 'int-test'];
      const config: CoveragePluginConfig = projectName
        ? // We do not need to run a coverageToolCommand. This is handled over the Nx task graph.
          {
            reports: Object.keys(
              (await createProjectGraphAsync()).nodes[projectName]?.data
                .targets ?? {},
            )
              .filter(target => targets.includes(target))
              .map(target => ({
                pathToProject: `packages/${projectName}`,
                resultsPath: `coverage/${projectName}/${target}s/lcov.info`,
              })),
          }
        : {
            reports: await getNxCoveragePaths(targets),
            coverageToolCommand: {
              command: `npx nx run-many -t ${targets.join(',')}`,
            },
          };
      return {
        plugins: [await coveragePlugin(config)],
        categories: [
          {
            slug: 'code-coverage',
            title: 'Code coverage',
            description:
              'Measures how much of your code is **covered by tests**.',
            refs: [
              {
                type: 'group',
                plugin: 'coverage',
                slug: 'coverage',
                weight: 1,
              },
            ],
          },
        ],
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Project', projectName || 'all'],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured coverage plugin preset for ${projectName || 'all projects'}`,
      }),
    },
  );
}

export async function configureJsPackagesPlugin(): Promise<CoreConfig> {
  return profiler.measureAsync(
    'preset:configure-plugin-js-packages',
    async () => {
      return {
        plugins: [await jsPackagesPlugin()],
        categories: [
          {
            slug: 'security',
            title: 'Security',
            description:
              'Finds known **vulnerabilities** in 3rd-party packages.',
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
        ],
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: 'Configured JS packages plugin preset',
      }),
    },
  );
}

export function configureTypescriptPlugin(projectName?: string): CoreConfig {
  return profiler.measure(
    'preset:configure-plugin-typescript',
    () => {
      const tsconfig = projectName
        ? `packages/${projectName}/tsconfig.lib.json`
        : 'tsconfig.base.json';
      return {
        plugins: [typescriptPlugin({ tsconfig })],
        categories: getCategories(),
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Project', projectName || 'all'],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured TypeScript plugin preset for ${projectName || 'all projects'}`,
      }),
    },
  );
}

export function configureJsDocsPlugin(projectName?: string): CoreConfig {
  return profiler.measure(
    'preset:configure-plugin-jsdocs',
    () => {
      const patterns: string[] = [
        `packages/${projectName ?? '*'}/src/**/*.ts`,
        `!**/node_modules`,
        `!**/{mocks,mock}`,
        `!**/*.{spec,test}.ts`,
        `!**/implementation/**`,
        `!**/internal/**`,
      ];
      return {
        plugins: [jsDocsPlugin(patterns)],
        categories: [
          {
            slug: 'docs',
            title: 'Documentation',
            description: 'Measures how much of your code is **documented**.',
            refs: [
              {
                type: 'group',
                plugin: 'jsdocs',
                slug: 'documentation-coverage',
                weight: 1,
              },
            ],
          },
        ],
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['Project', projectName || 'all'],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured JS Docs plugin preset for ${projectName || 'all projects'}`,
      }),
    },
  );
}

export async function configureLighthousePlugin(
  urls: PluginUrls,
): Promise<CoreConfig> {
  return profiler.measureAsync(
    'preset:configure-plugin-lighthouse',
    async () => {
      const lhPlugin = await lighthousePlugin(urls);
      const lhCategories: CategoryConfig[] = [
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
      return {
        plugins: [lhPlugin],
        categories: lighthouseCategories(lhPlugin, lhCategories),
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['URLs', String(urls.length)],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured Lighthouse plugin preset for ${urls.length} URLs`,
      }),
    },
  );
}

export function configureAxePlugin(urls: PluginUrls): CoreConfig {
  return profiler.measure(
    'preset:configure-plugin-axe',
    () => {
      const axe = axePlugin(urls);
      return {
        plugins: [axe],
        categories: axeCategories(axe),
      };
    },
    {
      color: 'primary-light',
      success: (config: CoreConfig) => ({
        properties: [
          ['URLs', String(urls.length)],
          ['Plugins', String(config.plugins?.length || 0)],
          ['Categories', String(config.categories?.length || 0)],
        ],
        tooltipText: `Configured Axe plugin preset for ${urls.length} URLs`,
      }),
    },
  );
}
