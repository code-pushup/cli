import { stylelintPlugin } from './lib/stylelint-plugin.js';

export { getAudits, getCategoryRefs } from './lib/utils.js';

export default stylelintPlugin;
export type { StyleLintPluginConfig } from './lib/config.js';
