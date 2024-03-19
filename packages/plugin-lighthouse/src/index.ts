import { lighthousePlugin } from './lib/lighthouse-plugin';

export { lighthousePlugin, LighthouseCliFlags } from './lib/lighthouse-plugin';
export {
  LIGHTHOUSE_REPORT_NAME,
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_AUDITS,
  LIGHTHOUSE_GROUPS,
} from './lib/constants';

export default lighthousePlugin;
