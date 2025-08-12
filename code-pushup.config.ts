import 'dotenv/config';
import { z } from 'zod';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsDocsCoreConfig,
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
  loadEnv,
  typescriptPluginConfig,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';
import { mergeConfigs } from './packages/utils/src/index.js';

// load upload configuration from environment
const envSchema = z.object({
  CP_SERVER: z.string().url(),
  CP_API_KEY: z.string().min(1),
  CP_ORGANIZATION: z.string().min(1),
  CP_PROJECT: z.string().min(1),
});
const projectName = 'cli';

const config: CoreConfig = {
  ...(await loadEnv(projectName)),
  plugins: [],
};

export default mergeConfigs(
  config,
  await coverageCoreConfigNx(),
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await typescriptPluginConfig({
    tsconfig: 'packages/cli/tsconfig.lib.json',
  }),
  await eslintCoreConfigNx(),
  jsDocsCoreConfig([
    'packages/**/src/**/*.ts',
    '!packages/**/node_modules',
    '!packages/**/{mocks,mock}',
    '!**/*.{spec,test}.ts',
    '!**/implementation/**',
    '!**/internal/**',
  ]),
);
