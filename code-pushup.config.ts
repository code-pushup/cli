import 'dotenv/config';
import { z } from 'zod';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
} from './dist/examples/plugins';
import coveragePlugin from './dist/packages/plugin-coverage';
import eslintPlugin, {
  eslintConfigFromNxProjects,
} from './dist/packages/plugin-eslint';
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
  persist: {
    outputDir: '.code-pushup',
    filename: 'report',
    format: ['json', 'md'],
  },

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
    coveragePlugin({
      coverageType: ['branch', 'function', 'line'],
      reports: [
        'coverage/cli/unit-tests/lcov.info',
        'coverage/core/unit-tests/lcov.info',
        'coverage/models/unit-tests/lcov.info',
        'coverage/utils/unit-tests/lcov.info',
        'coverage/plugin-eslint/unit-tests/lcov.info',
        'coverage/plugin-coverage/unit-tests/lcov.info',
      ],
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
          type: 'audit',
          plugin: 'coverage',
          slug: 'function-coverage',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'coverage',
          slug: 'branch-coverage',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'coverage',
          slug: 'line-coverage',
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
      ],
    },
  ],
};

export default config;
