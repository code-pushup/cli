import 'dotenv/config';
import {
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
  configureTypescriptPlugin,
  configureUpload,
} from '../../code-pushup.preset.js';
import { mergeConfigs } from '../utils/src/index.js';

const projectName = 'plugin-eslint';

export default mergeConfigs(
  configureUpload(projectName),
  await configureEslintPlugin(projectName),
  await configureCoveragePlugin(projectName),
  configureTypescriptPlugin(projectName),
  configureJsDocsPlugin(projectName),
);
