import 'dotenv/config';
import { z } from 'zod';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
  typescriptPluginConfigNx,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';
import { BASIC_CHECKES } from './packages/plugin-typescript/src/lib/constants';
import { mergeConfigs } from './packages/utils/src/index.js';

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

  plugins: [],
};

export default mergeConfigs(
  config,
  await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await eslintCoreConfigNx(),
  await typescriptPluginConfigNx({
    tsConfigPath: 'packages/plugin-typescript/tsconfig.lib.json',
    tsCodes: [...BASIC_CHECKES],
  }),
);
