import { typescriptPlugin } from './lib/typescript-plugin.js';

export { TYPESCRIPT_PLUGIN_SLUG } from './lib/constants.js';

export {
  getCategoryRefsFromAudits,
  getCategoryRefsFromGroups,
} from './lib/utils.js';
export {
  typescriptPlugin,
  type TypescriptPluginOptions,
} from './lib/typescript-plugin.js';
export default typescriptPlugin;
