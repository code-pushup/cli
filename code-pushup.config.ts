import 'dotenv/config';
import {
  jsPackagesCoreConfig,
  lighthouseCoreConfig,
} from './code-pushup.preset.js';
import type { CoreConfig } from './packages/models/src/index.js';
import { mergeConfigs } from './packages/utils/src/index.js';

const project = process.env['NX_TASK_TARGET_PROJECT'] || 'cli-workspace';

const config: CoreConfig = {
  ...(process.env['CP_API_KEY'] && {
    upload: {
      project,
      organization: 'code-pushup',
      server: 'https://api.staging.code-pushup.dev/graphql',
      apiKey: process.env['CP_API_KEY'],
    },
  }),
  plugins: [],
};

export default mergeConfigs(
  config,
  await jsPackagesCoreConfig(),
  await lighthouseCoreConfig(
    'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/',
  ),
);
