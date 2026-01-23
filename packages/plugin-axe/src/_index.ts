export { axePlugin } from './lib/axe-plugin.js';

export type { AxePluginOptions, AxePreset } from './lib/config.js';
export type { AxeGroupSlug } from './lib/groups.js';

export {
  axeAuditRef,
  axeAuditRefs,
  axeGroupRef,
  axeGroupRefs,
} from './lib/utils.js';
export { axeCategories } from './lib/categories.js';

// Utility for working with DOM-dependent libraries
export { withDom } from './lib/safe-axe-import.js';
