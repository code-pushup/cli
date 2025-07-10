import bundleStatsPlugin, { DEFAULT_GROUPING } from './src';

/**
 * Execute the code-pushup over Nx:
 * nx code-pushup:minimal plugin-bundle-stats
 */

const config = {
  plugins: [
    await bundleStatsPlugin({
      artefactsPath:
        //  './packages/plugin-bundle-stats/mocks/fixtures/angular-minimal/dist/angular-minimal/stats.json',
        './packages/plugin-bundle-stats/src/lib/__snapshots__/esbuild.stats.json',
      bundler: 'esbuild',
      configs: [
        // JavaScript bundles - should focus on main and polyfills outputs
        {
          title: 'Initial Bundles',
          description: 'Main and polyfills JavaScript bundles (~34KB expected)',
          include: ['dist/bundle.js', 'dist/bundle.css'], // Updated to match actual files
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
