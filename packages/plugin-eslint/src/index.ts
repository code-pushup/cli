import { eslintPlugin } from './lib/eslint-plugin.js';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config.js';

export {
  eslintConfigFromNxProjectAndDeps,
  // eslint-disable-next-line deprecation/deprecation
  eslintConfigFromNxProjects,
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from './lib/nx/index.js';
