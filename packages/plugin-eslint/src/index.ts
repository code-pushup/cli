import { eslintPlugin } from './lib/eslint-plugin';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config';

export {
  eslintConfigFromNxProjectAndDeps,
  // eslint-disable-next-line deprecation/deprecation
  eslintConfigFromNxProjects,
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from './lib/nx';
