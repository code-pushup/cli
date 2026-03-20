import { coveragePlugin } from './lib/coverage-plugin.js';

export default coveragePlugin;
export { coverageSetupBinding } from './lib/binding.js';
export type { CoveragePluginConfig } from './lib/config.js';
export { getNxCoveragePaths } from './lib/nx/coverage-paths.js';
