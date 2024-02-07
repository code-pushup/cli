import 'dotenv/config';
import { join } from 'node:path';
import { z } from 'zod';
import {
  LIGHTHOUSE_OUTPUT_FILE_DEFAULT,
  fileSizePlugin,
  fileSizeRecommendedRefs,
  lighthouseCorePerfGroupRefs,
  lighthousePlugin,
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
