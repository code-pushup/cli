import 'dotenv/config';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsDocsCoreConfig,
  jsDocsExclusionPatterns,
  jsPackagesCoreConfig,
  loadEnv,
  typescriptPluginConfig,
} from '../../code-pushup.preset.js';
import type { CoreConfig } from '../../packages/models/src/index.js';

const projectName = process.env.CP_PROJECT_NAME || 'models';

const config: CoreConfig = {
  ...(await loadEnv()),
  persist: {
    filename: `${projectName}-report`,
    outputDir: `packages/${projectName}/.code-pushup`,
  },
  plugins: [],
};

const configs = [
  config,
  await eslintCoreConfigNx(projectName),
  await coverageCoreConfigNx(projectName),
  await jsPackagesCoreConfig('package.json'), // Use workspace root package.json
  await typescriptPluginConfig({
    tsconfig: `packages/${projectName}/tsconfig.lib.json`,
  }),
  jsDocsCoreConfig([
    `packages/${projectName}/src/**/*.ts`,
    ...jsDocsExclusionPatterns,
  ]),
];

const mergedConfig = configs.reduce(
  (result, currentConfig) => ({
    ...result,
    ...currentConfig,
    plugins: [...(result.plugins || []), ...(currentConfig.plugins || [])],
    categories: [
      ...(result.categories || []),
      ...(currentConfig.categories || []),
    ],
  }),
  {} as CoreConfig,
);

export default mergedConfig;
