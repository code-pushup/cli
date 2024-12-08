import { coveragePlugin } from './lib/coverage-plugin.js';

export default coveragePlugin;
export type { CoveragePluginConfig } from './lib/config.js';
export { getNxCoveragePaths } from './lib/nx/coverage-paths.js';
