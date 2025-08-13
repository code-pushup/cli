import 'dotenv/config';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsDocsCoreConfig,
  jsDocsExclusionPatterns,
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
  loadEnv,
  mergeConfigs,
  typescriptPluginConfig,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';

const projectName = 'cli';

const config: CoreConfig = {
  ...(await loadEnv(projectName)),
  plugins: [],
};

export default mergeConfigs(
  config,
  await jsPackagesCoreConfig(),
  await coverageCoreConfigNx(projectName),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
  await eslintCoreConfigNx(projectName),
  jsDocsCoreConfig([
    `packages/${projectName}/src/**/*.ts`,
    ...jsDocsExclusionPatterns,
  ]),
  await typescriptPluginConfig({
    tsconfig: `packages/${projectName}/tsconfig.lib.json`,
  }),
);
