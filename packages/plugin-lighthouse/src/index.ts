import { DEFAULT_FLAGS } from 'chrome-launcher/dist/flags.js';
import { lighthousePlugin } from './lib/lighthouse-plugin';

export const DEFAULT_CHROME_FLAGS = [...DEFAULT_FLAGS, '--headless'];

export { LIGHTHOUSE_REPORT_NAME } from './lib/runner';
export {
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_OUTPUT_PATH,
} from './lib/constants';
export {
  lighthouseAuditRef,
  lighthouseGroupRef,
  type LighthouseGroupSlugs,
} from './lib/utils';
export type { LighthouseOptions } from './lib/types';
export { lighthousePlugin } from './lib/lighthouse-plugin';
export default lighthousePlugin;
