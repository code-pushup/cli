import { eslintPlugin } from './lib/eslint-plugin';

export default eslintPlugin;

export type { ESLintPluginConfig } from './lib/config';

export { eslintConfigFromNxProjects } from './lib/nx';
