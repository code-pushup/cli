/* eslint-disable @nx/enforce-module-boundaries */
import { createProjectGraphAsync } from '@nx/devkit';
import type { CoreConfig, PluginUrls } from './packages/models/src/index.js';
import axePlugin, {
  type AxePluginOptions,
  axeGroupRefs,
} from './packages/plugin-axe/src/index.js';
import coveragePlugin, {
  type CoveragePluginConfig,
  getNxCoveragePaths,
} from './packages/plugin-coverage/src/index.js';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from './packages/plugin-eslint/src/index.js';
import jsPackagesPlugin from './packages/plugin-js-packages/src/index.js';
import jsDocsPlugin from './packages/plugin-jsdocs/src/index.js';
import {
  lighthouseGroupRefs,
  lighthousePlugin,
} from './packages/plugin-lighthouse/src/index.js';
import typescriptPlugin, {
  getCategories,
  tsconfigFromAllNxProjects,
} from './packages/plugin-typescript/src/index.js';

export function configureUpload(projectName: string = 'workspace'): CoreConfig {
  return {
    ...(process.env['CP_API_KEY'] && {
      upload: {
        server: 'https://api.staging.code-pushup.dev/graphql',
        apiKey: process.env['CP_API_KEY'],
        organization: 'code-pushup',
        project: `cli-${projectName}`,
      },
    }),
    plugins: [],
  };
}

export async function configureEslintPlugin(
  projectName?: string,
): Promise<CoreConfig> {
  return {
    plugins: [
      projectName
        ? await eslintPlugin(await eslintConfigFromNxProject(projectName), {
            artifacts: {
              // We leverage Nx dependsOn to only run all lint targets before we run code-pushup
              // generateArtifactsCommand: 'npx nx run-many -t lint',
              artifactsPaths: [
                `packages/${projectName}/.eslint/eslint-report.json`,
              ],
            },
          })
        : await eslintPlugin(await eslintConfigFromAllNxProjects()),
    ],
    categories: [
      {
        slug: 'bug-prevention',
        title: 'Bug prevention',
        description: 'Lint rules that find **potential bugs** in your code.',
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
          { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
        ],
      },
    ],
  };
}

export async function configureCoveragePlugin(
  projectName?: string,
): Promise<CoreConfig> {
  const targets = ['unit-test', 'int-test'];
  const config: CoveragePluginConfig = projectName
    ? // We do not need to run a coverageToolCommand. This is handled over the Nx task graph.
      {
        reports: Object.keys(
          (await createProjectGraphAsync()).nodes[projectName]?.data.targets ??
            {},
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
        description: 'Measures how much of your code is **covered by tests**.',
        refs: [
          { type: 'group', plugin: 'coverage', slug: 'coverage', weight: 1 },
        ],
      },
    ],
  };
}

export async function configureJsPackagesPlugin(): Promise<CoreConfig> {
  return {
    plugins: [await jsPackagesPlugin()],
    categories: [
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
    ],
  };
}

export async function configureTypescriptPlugin(
  projectName?: string,
): Promise<CoreConfig> {
  const tsconfig = projectName
    ? `packages/${projectName}/tsconfig.lib.json`
    : await tsconfigFromAllNxProjects({
        exclude: [
          'test-fixtures', // Intentionally incomplete tsconfigs
          'models', // Uses ts-patch transformer plugin
        ],
      });
  return {
    plugins: [typescriptPlugin({ tsconfig })],
    categories: getCategories(),
  };
}

export function configureJsDocsPlugin(projectName?: string): CoreConfig {
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
}

export async function configureLighthousePlugin(
  urls: PluginUrls,
): Promise<CoreConfig> {
  const lhPlugin = await lighthousePlugin(urls);
  return {
    plugins: [lhPlugin],
    categories: [
      {
        slug: 'performance',
        title: 'Performance',
        refs: lighthouseGroupRefs(lhPlugin, 'performance'),
      },
      {
        slug: 'a11y',
        title: 'Accessibility',
        refs: lighthouseGroupRefs(lhPlugin, 'accessibility'),
      },
      {
        slug: 'best-practices',
        title: 'Best Practices',
        refs: lighthouseGroupRefs(lhPlugin, 'best-practices'),
      },
      {
        slug: 'seo',
        title: 'SEO',
        refs: lighthouseGroupRefs(lhPlugin, 'seo'),
      },
    ],
  };
}

export function configureAxePlugin(
  urls: PluginUrls,
  options?: AxePluginOptions,
): CoreConfig {
  const axe = axePlugin(urls, options);
  return {
    plugins: [axe],
    categories: [
      {
        slug: 'axe-a11y',
        title: 'Axe Accessibility',
        refs: axeGroupRefs(axe),
      },
    ],
  };
}
