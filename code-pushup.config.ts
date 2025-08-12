import 'dotenv/config';
import {
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
  loadEnv,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';
import { mergeConfigs } from './packages/utils/src/index.js';

const projectName = 'cli';

const config: CoreConfig = {
  ...(await loadEnv(projectName)),
  plugins: [],
};

export default mergeConfigs(
  config,
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
);
