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

const projectName = process.env.NX_TASK_TARGET_PROJECT;

const config: CoreConfig = {
  ...(await loadEnv()),
  plugins: [],
};

export default mergeConfigs(
  config,
  await coverageCoreConfigNx(projectName),
  await jsPackagesCoreConfig('package.json'), // Use workspace root package.json
  await typescriptPluginConfig({
    tsconfig: `packages/${projectName}/tsconfig.lib.json`,
  }),
  await eslintCoreConfigNx(projectName),
  jsDocsCoreConfig([
    `packages/${projectName}/src/**/*.ts`,
    ...jsDocsExclusionPatterns,
  ]),
);
