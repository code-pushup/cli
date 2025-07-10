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
        './packages/plugin-bundle-stats/mocks/fixtures/angular-minimal/dist/angular-minimal/stats.json',
      bundler: 'esbuild',
      configs: [
        // JavaScript bundles - should focus on main and polyfills outputs
        {
          title: 'Initial Bundles',
          description: 'Main and polyfills JavaScript bundles (~34KB expected)',
          include: ['main*.js', 'polyfills*.js', 'styles*.css'],
          thresholds: {
            totalSize: [30 * 1024, 50 * 1024], // 30KB warning, 50KB error
            artefactSize: [35 * 1024, 40 * 1024], // Individual file limits
          },
        },
      ],

      // Add the default grouping configuration to enable emoji formatting
      // Enhanced penalty configuration
      penalty: {
        errorWeight: 1.0, // Full penalty for errors
        warningWeight: 0.5, // Reduced penalty for warnings
        blacklistWeight: 0.8, // Significant penalty for blacklisted items
      },

      // Pruning options to keep output manageable
      pruning: {
        maxChildren: 8, // Show up to 8 children per node
        maxDepth: 5, // Limit nesting depth
      },
    }),
  ],
};

export default config;
