import 'dotenv/config';
import { z } from 'zod';
import {
  KNIP_CATEGORY_REFS,
  KNIP_GROUP_ALL,
  KNIP_GROUP_DEPENDENCIES, // LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  fileSizePlugin,
  fileSizeRecommendedRefs,
  knipPlugin,
  packageJsonDocumentationGroupRef, // lighthousePlugin, lighthouseCorePerfGroupRefs,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
} from './dist/examples/plugins';
import coveragePlugin, {
  getNxCoveragePaths,
} from './dist/packages/plugin-coverage';
import eslintPlugin, {
  eslintConfigFromNxProjects,
} from './dist/packages/plugin-eslint';
import jsPackagesPlugin from './dist/packages/plugin-js-packages';
import type { CoreConfig } from './packages/models/src';

// load upload configuration from environment
const envSchema = z
  .object({
    CP_SERVER: z.string().url(),
    CP_API_KEY: z.string().min(1),
    CP_ORGANIZATION: z.string().min(1),
    CP_PROJECT: z.string().min(1),
  })
  .partial();
const env = await envSchema.parseAsync(process.env);

const config: CoreConfig = {
  ...(env.CP_SERVER &&
    env.CP_API_KEY &&
    env.CP_ORGANIZATION &&
    env.CP_PROJECT && {
      upload: {
        server: env.CP_SERVER,
        apiKey: env.CP_API_KEY,
        organization: env.CP_ORGANIZATION,
        project: env.CP_PROJECT,
      },
    }),

  plugins: [
    await eslintPlugin(await eslintConfigFromNxProjects()),

    await coveragePlugin({
      coverageToolCommand: {
        command: 'npx',
        args: [
          'nx',
          'run-many',
          '-t',
          'unit-test',
          'integration-test',
          '--coverage.enabled',
          '--skipNxCache',
        ],
      },
      reports: await getNxCoveragePaths(['unit-test', 'integration-test']),
    }),

    await jsPackagesPlugin({ packageManager: 'npm' }),

    fileSizePlugin({
      directory: './dist/examples/react-todos-app',
      pattern: /\.js$/,
      budget: 174_080, // 170 kB
    }),

    packageJsonPlugin({
      directory: './dist/packages',
      license: 'MIT',
      type: 'module',
    }),

    // see https://github.com/code-pushup/cli/issues/538
    // await lighthousePlugin({
    //   url: 'https://staging.code-pushup.dev/login',
    //   outputPath: join('.code-pushup', LIGHTHOUSE_OUTPUT_FILE_DEFAULT),
    //   headless: true,
    // }),

    await knipPlugin({}),
  ],

  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
    {
      slug: 'code-coverage',
      title: 'Code coverage',
      refs: [
        {
          type: 'group',
          plugin: 'coverage',
          slug: 'coverage',
          weight: 1,
        },
      ],
    },
    {
      slug: 'security',
      title: 'Security',
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
      refs: [
        {
          type: 'group',
          plugin: 'js-packages',
          slug: 'npm-outdated',
          weight: 1,
        },
      ],
    },
    {
      slug: 'custom-checks',
      title: 'Custom checks',
      refs: [
        ...fileSizeRecommendedRefs,
        packageJsonPerformanceGroupRef,
        packageJsonDocumentationGroupRef,
        // ...lighthouseCorePerfGroupRefs,
        // knip
        { slug: 'files', weight: 1 },
        { slug: 'dependencies', weight: 1 },
        // {slug: 'devdependencies', weight: 1},
        { slug: 'optionalpeerdependencies', weight: 1 },
        // {slug: 'unlisted', weight: 1},
        { slug: 'binaries', weight: 1 },
        { slug: 'unresolved', weight: 1 },
        { slug: 'exports', weight: 1 },
        { slug: 'types', weight: 1 },
        { slug: 'nsexports', weight: 1 },
        { slug: 'nstypes', weight: 1 },
        { slug: 'enummembers', weight: 1 },
        { slug: 'classmembers', weight: 1 },
        { slug: 'duplicates', weight: 1 },
      ],
    },
  ],
};

export default config;
