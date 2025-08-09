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
import { mergeConfigs } from '../../packages/utils/src/index.js';

const projectName = process.env.CP_PROJECT_NAME || 'nx-plugin';

const config: CoreConfig = {
  ...(await loadEnv()),
  persist: {
    filename: `${projectName}-report`,
    outputDir: `packages/${projectName}/.code-pushup`,
  },
  plugins: [],
};

export default mergeConfigs(
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
);
