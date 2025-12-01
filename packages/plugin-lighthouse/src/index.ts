import { lighthousePlugin } from './lib/lighthouse-plugin.js';

export { LIGHTHOUSE_REPORT_NAME } from './lib/runner/constants.js';
export {
  DEFAULT_CHROME_FLAGS,
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_OUTPUT_PATH,
} from './lib/constants.js';
export { lighthouseAuditRef, lighthouseGroupRef } from './lib/utils.js';
export type { LighthouseGroupSlug, LighthouseOptions } from './lib/types.js';
export { lighthousePlugin } from './lib/lighthouse-plugin.js';
export default lighthousePlugin;
export { mergeLighthouseCategories } from './lib/merge-categories.js';
