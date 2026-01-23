import { axePlugin } from './lib/axe-plugin.js';
import './lib/polyfills.dom';
import './lib/polyfills.dom.js';

export default axePlugin;

export type { AxePluginOptions, AxePreset } from './lib/config.js';
export type { AxeGroupSlug } from './lib/groups.js';

export {
  axeAuditRef,
  axeAuditRefs,
  axeGroupRef,
  axeGroupRefs,
} from './lib/utils.js';
export { axeCategories } from './lib/categories.js';
