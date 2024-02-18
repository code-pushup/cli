import { coveragePlugin } from './lib/coverage-plugin';

export default coveragePlugin;
export type { CoveragePluginConfig } from './lib/config';
export { getNxCoveragePaths } from './lib/nx/coverage-paths';
