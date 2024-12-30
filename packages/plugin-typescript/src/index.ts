import { typescriptPlugin } from './lib/typescript-plugin.js';

export { TYPESCRIPT_PLUGIN_SLUG } from './lib/constants.js';

export { getCurrentTsVersion } from './lib/runner/utils.js';
export {
  getCategoryRefsFromAudits,
  getCategoryRefsFromGroups,
} from './lib/utils.js';
export {
  typescriptPlugin,
  TypescriptPluginOptions,
} from './lib/typescript-plugin.js';
export default typescriptPlugin;
export { getTsDefaultsFilename } from './lib/runner/constants.js';
