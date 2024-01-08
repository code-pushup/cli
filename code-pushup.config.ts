import 'dotenv/config';
import { z } from 'zod';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
  packageJsonVersionControlGroupRef,
} from './dist/examples/plugins';
import eslintPlugin, {
  eslintConfigFromNxProjects,
} from './dist/packages/plugin-eslint';
import type { CoreConfig } from './packages/models/src';

// load upload configuration from environment
const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
const env = await envSchema.parseAsync(process.env);

const config: CoreConfig = {
  persist: {
    outputDir: '.code-pushup',
    filename: 'report',
    format: ['json', 'md'],
  },

  upload: {
    server: env.CP_SERVER,
    apiKey: env.CP_API_KEY,
    organization: env.CP_ORGANIZATION,
    project: env.CP_PROJECT,
  },

  plugins: [
    await eslintPlugin(await eslintConfigFromNxProjects()),
    fileSizePlugin({
      directory: './dist/packages',
      pattern: /\.js$/,
      budget: 42_000,
    }),
    packageJsonPlugin({
      directory: './packages',
      license: 'MIT',
      type: 'module',
      dependencies: {
        zod: '^3.22.4',
      },
    }),
  ],

  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
        packageJsonVersionControlGroupRef,
      ],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
    {
      slug: 'performance',
      title: 'Performance',
      refs: [...fileSizeRecommendedRefs, packageJsonPerformanceGroupRef],
    },
    {
      slug: 'documentation',
      title: 'Documentation',
      refs: [packageJsonDocumentationGroupRef],
    },
  ],
};

export default config;
