import { typescriptPlugin } from './lib/typescript-plugin.js';

export default typescriptPlugin;

export { TYPESCRIPT_PLUGIN_SLUG } from './lib/constants.js';
export {
  typescriptPluginConfigSchema,
  type TypescriptPluginConfig,
  type TypescriptPluginOptions,
} from './lib/schema.js';
export { getCategories, getCategoryRefsFromGroups } from './lib/utils.js';
