import 'dotenv/config';
import {
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
  configureTypescriptPlugin,
  configureUpload,
} from '../../code-pushup.preset.js';
import { mergeConfigs } from '../utils/src/index.js';

const projectName = 'create-cli';

export default mergeConfigs(
  configureUpload(projectName),
  await configureEslintPlugin(projectName),
  await configureCoveragePlugin(projectName),
  configureTypescriptPlugin(projectName),
  configureJsDocsPlugin(projectName),
);
