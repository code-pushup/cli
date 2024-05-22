import { eslintPlugin } from './lib/eslint-plugin';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config';

export {
  eslintConfigFromNxProjectAndDeps,
  eslintConfigFromNxProjects,
  eslintConfigFromAllNxProjects,
} from './lib/nx';
