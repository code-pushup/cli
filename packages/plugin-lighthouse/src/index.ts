import { lighthousePlugin } from './lib/lighthouse-plugin';

export default lighthousePlugin;
export { lighthousePlugin } from './lib/lighthouse-plugin';
export { LIGHTHOUSE_PLUGIN_SLUG } from './lib/constants';
export * from './lib/runner';
export { lighthouseAuditRef, lighthouseGroupRef } from './lib/utils';
