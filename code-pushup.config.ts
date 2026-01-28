import 'dotenv/config';
import {
  configureAxePlugin,
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
  configureJsPackagesPlugin,
  configureLighthousePlugin,
  configureTypescriptPlugin,
  configureUpload,
} from './code-pushup.preset.js';
import { mergeConfigs } from './packages/utils/src/index.js';

// TODO: replace with something meaningful, or move out of the repo
const TARGET_URL =
  'https://github.com/code-pushup/cli?tab=readme-ov-file#code-pushup-cli/';

export default mergeConfigs(
  configureUpload(),
  await configureEslintPlugin(),
  await configureCoveragePlugin(),
  await configureJsPackagesPlugin(),
  await configureTypescriptPlugin(),
  configureJsDocsPlugin(),
  await configureLighthousePlugin(TARGET_URL),
  configureAxePlugin(TARGET_URL),
);
