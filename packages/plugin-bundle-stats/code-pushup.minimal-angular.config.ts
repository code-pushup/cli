import bundleStatsPlugin, { DEFAULT_GROUPING } from './src';

/**
 * This is a comprehensive config for the bundle stats plugin showcasing various features.
 *
 * ⚠️ NOTE: Due to a current limitation in the plugin's filtering logic,
 * all audits will show the same files (both inputs and outputs).
 * The include/exclude patterns are not being applied correctly.
 *
 * This configuration demonstrates the intended usage patterns and thresholds
 * for different types of bundle analysis in Angular projects.
 *
 * The project is a minimal Angular project with examples of:
 * - Initial bundles (main, polyfills, vendor)
 * - Global styles
 * - Third-party dependencies (Zone.js)
 * - Application source code
 *
 * Generate the stats file:
 * cd ./projects/plugin-bundle-stats/mocks/fixtures/angular-minimal
 * npm run build:stats
 *
 * Stats artefact location:
 * ./packages/plugin-bundle-stats/mocks/fixtures/angular-minimal/dist/angular-minimal/stats.json
 *
 * Execute the code-pushup command:
 * npx @code-pushup/cli collect --config packages/plugin-bundle-stats/code-pushup.minimal-angular.config.ts
 *
 * Execute the code-pushup over Nx:
 * nx code-pushup:minimal-angular plugin-bundle-stats
 */

const config = {
  plugins: [
    await bundleStatsPlugin({
      artefactsPath:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-minimal.stats.json',
      bundler: 'esbuild',
      configs: [
        {
          title: 'Initial Bundles',
          selection: {
            includeOutputs: ['main-*.js', 'polyfills-*.js'],
          },
          thresholds: {
            totalSize: [30 * 1024, 50 * 1024],
          },
        },
        {
          title: 'All',
          selection: {
            includeOutputs: ['*'],
          },
          thresholds: {
            totalSize: [30 * 1024, 50 * 1024],
          },
        },
      ],

      // Pruning options to show more details including inputs
      pruning: {
        maxChildren: 15, // Show more children per node
        maxDepth: 8, // Increase depth to show inputs
      },
    }),
  ],
};

export default config;
