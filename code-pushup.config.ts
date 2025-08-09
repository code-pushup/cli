import 'dotenv/config';
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

const config: CoreConfig = {
  ...(await loadEnv()),
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
