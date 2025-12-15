import { eslintPlugin } from './lib/eslint-plugin.js';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config.js';
export { ESLINT_PLUGIN_SLUG } from './lib/constants.js';

export {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
  eslintConfigFromNxProjectAndDeps,
  eslintConfigFromNxProjects,
} from './lib/nx/nx.js';
