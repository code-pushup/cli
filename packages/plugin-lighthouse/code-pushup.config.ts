import 'dotenv/config';
import {
  coverageCoreConfigNx,
  eslintCoreConfigNx,
  jsDocsCoreConfig,
  jsDocsExclusionPatterns,
  loadEnv,
  mergeConfigs,
  typescriptPluginConfig,
} from '../../code-pushup.preset.js';
import type { CoreConfig } from '../../packages/models/src/index.js';

const projectName = process.env['NX_TASK_TARGET_PROJECT'];

const config: CoreConfig = {
  ...(await loadEnv()),
  plugins: [],
};

export default mergeConfigs(
  config,
  await eslintCoreConfigNx(projectName),
  await coverageCoreConfigNx({ projectName, targetNames: ['unit-test'] }),
  await typescriptPluginConfig({
    tsconfig: `packages/${projectName}/tsconfig.lib.json`,
  }),
  jsDocsCoreConfig([
    `packages/${projectName}/src/**/*.ts`,
    ...jsDocsExclusionPatterns,
  ]),
);
