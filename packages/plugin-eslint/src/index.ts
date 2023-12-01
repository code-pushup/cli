import { eslintPlugin } from './lib/eslint-plugin';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config';

export {
  eslintConfigFromNxProject,
  eslintConfigFromNxProjects,
} from './lib/nx';
