import { DEFAULT_FLAGS } from 'chrome-launcher/dist/flags.js';
import 'dotenv/config';
import { z } from 'zod';
import {
  coverageCategories,
  eslintCategories,
  eslintCoreConfigNx,
  jsPackagesCategories,
  jsPackagesCoreConfig,
  lighthouseCategories,
  lighthouseCoreConfig,
} from './code-pushup.preset';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
} from './dist/examples/plugins';
import coveragePlugin, {
  getNxCoveragePaths,
} from './dist/packages/plugin-coverage';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
} from './dist/packages/plugin-eslint';
import jsPackagesPlugin from './dist/packages/plugin-js-packages';
import {
  lighthouseGroupRef,
  lighthousePlugin,
} from './dist/packages/plugin-lighthouse';
import { mergeConfigs } from './dist/packages/utils';
import type { CoreConfig } from './packages/models/src';

// load upload configuration from environment
const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
const { data: env } = await envSchema.safeParseAsync(process.env);

const config: CoreConfig = {
  ...(env && {
    upload: {
      server: env.CP_SERVER,
      apiKey: env.CP_API_KEY,
      organization: env.CP_ORGANIZATION,
      project: env.CP_PROJECT,
    },
  }),

  plugins: [
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
  ],

  categories: [
    ...coverageCategories,
    {
      slug: 'custom-checks',
      title: 'Custom checks',
      refs: [
        ...fileSizeRecommendedRefs,
        packageJsonPerformanceGroupRef,
        packageJsonDocumentationGroupRef,
      ],
    },
  ],
};

export default mergeConfigs(
  config,
  jsPackagesCoreConfig(),
  lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  eslintCoreConfigNx(),
);
