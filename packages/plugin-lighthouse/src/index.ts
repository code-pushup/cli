import { lighthousePlugin } from './lib/lighthouse-plugin.js';

export { LIGHTHOUSE_REPORT_NAME } from './lib/runner/index.js';
export {
  DEFAULT_CHROME_FLAGS,
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_OUTPUT_PATH,
} from './lib/constants.js';
export {
  lighthouseAuditRef,
  lighthouseGroupRef,
  type LighthouseGroupSlugs,
} from './lib/utils.js';
export type { LighthouseOptions } from './lib/types.js';
export { lighthousePlugin } from './lib/lighthouse-plugin.js';
export default lighthousePlugin;
