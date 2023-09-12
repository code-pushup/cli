import { PluginConfig } from '@quality-metrics/models';
import {
  mockCategory,
  mockConfig,
  mockPluginConfig,
  mockReport,
} from './schema-helper.mock';

export const nxValidatorsPlugin: () => PluginConfig = () => ({
  runner: {
    command: 'bun',
    args: ['--help'],
    outputPath: 'nx-validators-plugin-runner-output.json',
  },
  meta: {
    // package and version optional
    slug: 'nx-validators',
    name: 'NxValidatorsPlugin',
    docsUrl: `https://github.com/BioPhoton/nx-validators/tree/main/README.md`,
  },
  groups: [
    {
      slug: 'use-nx-tooling',
      description: 'Nx Tooling compliance checks',
      title: 'Use Nx Tooling',
      refs: [
        {
          slug: 'check-version-mismatch',
          weight: 0,
        },
        {
          slug: 'use-nx-cloud',
          weight: 0,
        },
        {
          slug: 'check-gulp-usage',
          weight: 0,
        },
      ],
    },
    {
      slug: 'use-quality-tooling',
      description: 'Eslint, tsconfig, Prettier, ... Tooling compliance checks',
      title: 'Use Quality Tooling',
      refs: [
        {
          slug: 'check-eslint-config',
          weight: 0,
        },
        {
          slug: 'check-prettier-config',
          weight: 0,
        },
      ],
    },
    {
      slug: 'normalize-typescript-config',
      description:
        'Ensure that all typescript configurations are following the Nx standards',
      title: 'Normalize Typescript configuration',
      refs: [
        {
          slug: 'check-root-tsconfig-base',
          weight: 0,
        },
        {
          slug: 'check-tsconfig-paths',
          weight: 0,
        },
      ],
    },
    {
      slug: 'use-workspace-layout',
      description:
        'Folder structure, project.json files, ... validate the workspace layout',
      title: 'Use Workspace Layout',
      refs: [
        {
          slug: 'use-project-json',
          weight: 0,
        },
      ],
    },
  ],
  audits: [
    {
      slug: 'check-prettier-config',
      title: 'Check Prettier Configuration',
      label: 'Check Prettier Configuration',
      description:
        'The goal of that validator is to check that prettier is correctly configured in the current repository.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-prettier-config/Readme.md',
    },
    {
      slug: 'check-tslint-not-used',
      title: 'Check TSLint is not Used',
      label: 'Check TSLint is not Used',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-tslint-not-used/Readme.md',
    },
    {
      slug: 'use-single-entry-file',
      title: 'Use single entry file',
      label: 'Use single entry file',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/use-single-entry-file/Readme.md',
    },
    {
      slug: 'check-version-mismatch',
      title: 'Check Version Mismatch',
      label: 'Check Version Mismatch',
      description:
        'This validator checks that all the packages that are used in the repository are aligned with the dependency from the monorepo dependencies.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-version-mismatch/Readme.md',
    },
    {
      slug: 'use-project-json',
      title: 'Use project.json Files',
      label: 'Use project.json Files',
      description:
        'This validator checks that everything that could be considered as a Nx project should contain a file `project.json`.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/use-project-json/Readme.md',
    },
    {
      slug: 'use-nx-cloud',
      title: 'Use Nx Cloud',
      label: 'Use Nx Cloud',
      description:
        'This validator checks that the workspace is using Nx Cloud.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/use-nx-cloud/Readme.md',
    },
    {
      slug: 'use-workspace-folder-structure',
      title: 'Use workspace folder structure',
      label: 'Use workspace folder structure',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/use-workspace-folder-structure/Readme.md',
    },
    {
      slug: 'check-tsconfig-paths',
      title: 'Check tsconfig paths',
      label: 'Check tsconfig paths',
      description:
        'This validator checks that the main typescript configuration is containing valid path configurations. To do so, wildcard paths are not allowed.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-tsconfig-paths/Readme.md',
    },
    {
      slug: 'check-root-tsconfig-base',
      title: 'Check root tsconfig.base.json',
      label: 'Check root tsconfig.base.json',
      description:
        'The goal of that validator is to check that the main typescript configurations is correctly configured in the current repository.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-root-tsconfig-base/Readme.md',
    },
    {
      slug: 'check-tsconfig-per-project',
      title: 'Check Boundaries Linting Configuration',
      label: 'Check Boundaries Linting Configuration',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-tsconfig-per-project/Readme.md',
    },
    {
      slug: 'check-ts-compiler-options',
      title: 'Check Typescript Compiler Options',
      label: 'Check Typescript Compiler Options',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-ts-compiler-options/Readme.md',
    },
    {
      slug: 'use-publishable-library',
      title: 'Use publishable library',
      label: 'Use publishable library',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/use-publishable-library/Readme.md',
    },
    {
      slug: 'check-external-imports',
      title: 'Check External Imports',
      label: 'Check External Imports',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-external-imports/Readme.md',
    },
    {
      slug: 'check-gulp-usage',
      title: 'Check Gulp Usage',
      label: 'Check Gulp Usage',
      description:
        'In a Nx architecture, Gulp is not needed anymore because [Nx Tasks](https://nx.dev/core-features/run-tasks) will be used instead to standardize the executions you can have on each project.',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-gulp-usage/Readme.md',
    },
    {
      slug: 'check-eslint-config',
      title: 'Check ESLint Configs',
      label: 'Check ESLint Configs',
      description:
        "This validator checks for the `eslint` package existence in the target's project repository. It also compares eslint configuration with the expected one, and generates a report with the diff object of the configurations.",
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-eslint-config/Readme.md',
    },
    {
      slug: 'check-boundaries-config',
      title: 'Check Boundaries Linting Configuration',
      label: 'Check Boundaries Linting Configuration',
      description: '`TBD`',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-boundaries-config/Readme.md',
    },
    {
      slug: 'check-webpack-config',
      title: 'Check Webpack Config',
      label: 'Check Webpack Config',
      description: '',
      docsUrl:
        'https://github.com/BioPhoton/nx-validators/tree/main/lib/workspace-validation/validators/check-webpack-config/Readme.md',
    },
  ],
});

export const nxValidatorsOnlyConfig = mockConfig();
nxValidatorsOnlyConfig.plugins = [nxValidatorsPlugin()];
nxValidatorsOnlyConfig.categories = [
  mockCategory({
    categorySlug: 'nx-quality',
    pluginSlug: 'nx-validators',
    auditSlug: nxValidatorsPlugin().audits.map(({ slug }) => slug),
  }),
];

export const nxValidatorsOnlyReport = mockReport();

// ==============

const pluginSlug = ['plg-0', 'plg-1', 'plg-2'];
const auditSlug0 = ['0a', '0b', '0c', '0d'];
const auditSlug1 = ['1a', '1b', '1c'];
const auditSlug2 = ['2a', '2b', '2c', '2d', '2e'];

export const dummyConfig = mockConfig();
dummyConfig.plugins = [
  mockPluginConfig({ pluginSlug: pluginSlug[0], auditSlug: auditSlug0 }),
  mockPluginConfig({ pluginSlug: pluginSlug[1], auditSlug: auditSlug1 }),
  mockPluginConfig({ pluginSlug: pluginSlug[2], auditSlug: auditSlug2 }),
];

dummyConfig.categories = [
  mockCategory({
    pluginSlug: pluginSlug[0],
    categorySlug: 'performance',
    auditSlug: auditSlug0,
  }),
  mockCategory({
    pluginSlug: pluginSlug[1],
    categorySlug: 'a11y',
    auditSlug: auditSlug1,
  }),
  mockCategory({
    pluginSlug: pluginSlug[2],
    categorySlug: 'seo',
    auditSlug: auditSlug2,
  }),
];

export const dummyReport = mockReport({
  pluginSlug: pluginSlug[0],
  auditSlug: auditSlug0,
});
