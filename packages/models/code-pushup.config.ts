import 'dotenv/config';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsDocsCoreConfig,
  jsDocsExclusionPatterns,
  jsPackagesCoreConfig,
  loadEnv,
  mergeConfigs,
  typescriptPluginConfig,
} from '../../code-pushup.preset.js';
import type { CoreConfig } from '../../packages/models/src/index.js';

const projectName = process.env.NX_TASK_TARGET_PROJECT;

const config: CoreConfig = {
  ...(await loadEnv()),
  plugins: [],
};

// This part should use mergeConfig in a normal setup, but here we are manually merging to avoid circular dependencies
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
