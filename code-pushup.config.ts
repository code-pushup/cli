import 'dotenv/config';
import { z } from 'zod';
import { mergeConfigs } from '@code-pushup/utils';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
} from './code-pushup.preset.js';
import {
  fileSizePlugin,
  fileSizeRecommendedRefs,
  packageJsonDocumentationGroupRef,
  packageJsonPerformanceGroupRef,
  packageJsonPlugin,
} from './examples/plugins/src/index.js';
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
    fileSizePlugin({
      directory: './dist/packages',
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

export default mergeConfigs(
  config,
  await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await eslintCoreConfigNx(),
);
