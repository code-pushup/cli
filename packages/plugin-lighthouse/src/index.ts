import { lighthousePlugin } from './lib/lighthouse-plugin';

export { LIGHTHOUSE_REPORT_NAME } from './lib/runner';
export {
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_OUTPUT_PATH,
} from './lib/constants';
export {
  lighthouseAuditRef,
  lighthouseGroupRef,
  LighthouseGroupSlugs,
} from './lib/utils';
export { LighthouseOptions } from './lib/types';
export { lighthousePlugin } from './lib/lighthouse-plugin';
export default lighthousePlugin;
