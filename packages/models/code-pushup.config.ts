import 'dotenv/config';
import {
  configureCoveragePlugin,
  configureEslintPlugin,
  configureJsDocsPlugin,
  configureUpload,
} from '../../code-pushup.preset.js';
import type { CoreConfig } from './src/index.js';

const projectName = 'models';

// cannot use mergeConfigs from utils package, would create cycle in Nx graph
const config: CoreConfig = [
  await configureEslintPlugin(projectName),
  await configureCoveragePlugin(projectName),
  // FIXME: Can't create TS program in getDiagnostics. Cannot find module './packages/models/transformers/dist'
  // configureTypescriptPlugin(projectName),
  await configureJsDocsPlugin(projectName),
].reduce(
  (acc, { plugins, categories }) => ({
    ...acc,
    plugins: [...acc.plugins, ...plugins],
    categories: [...(acc.categories ?? []), ...(categories ?? [])],
  }),
  configureUpload(projectName),
);

export default config;
