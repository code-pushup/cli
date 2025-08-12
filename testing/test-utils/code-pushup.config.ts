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

const projectName = process.env.CP_PROJECT_NAME || 'test-utils';

const config: CoreConfig = {
  ...(await loadEnv()),
  persist: {
    filename: `${projectName}-report`,
    outputDir: `testing/${projectName}/.code-pushup`,
  },
  plugins: [],
};

export default mergeConfigs(
  config,
  await eslintCoreConfigNx(projectName),
  await typescriptPluginConfig({
    tsconfig: `testing/${projectName}/tsconfig.lib.json`,
  }),
  jsDocsCoreConfig([
    `testing/${projectName}/src/**/*.ts`,
    ...jsDocsExclusionPatterns,
  ]),
);
