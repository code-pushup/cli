import bundleStatsPlugin from './src';

/**
 * This is a large config for the bundle stats plugin.
 *
 * The projects as a minimal Angular project with minimal examples:
 * - eager and lazy routes
 * - @defer
 * - lazy loading services
 *
 * Generate the stats file:
 * cd ./projects/plugin-bundle-stats/mocks/fixtures/angular-large
 * npm run build:stats
 *
 * Stats artefact location:
 * ./packages/plugin-bundle-stats/mocks/fixtures/angular-large/dist/angular-large/stats.json
 *
 * Execute the code-pushup command:
 * npx @code-pushup/cli collect --config packages/plugin-bundle-stats/code-pushup.minimal-angular.config.ts
 * npx @code-pushup/cli collect --config packages/plugin-bundle-stats/code-pushup.large-angular.config.ts
 *
 * Execute the code-pushup over Nx:
 * nx code-pushup:large-angular plugin-bundle-stats
 *  nx code-pushup:minimal-angular plugin-bundle-stats
 */

const config = {
  plugins: [
    await bundleStatsPlugin({
      artefactsPath:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/large-angular.stats.json',
      bundler: 'esbuild',
      configs: [
        {
          title: 'Initial Bundles',
          include: ['main-*.js', 'polyfills-*.js', '*.css'],
          thresholds: {
            totalSize: [300 * 1024, 1 * 1024 * 1024],
            artefactSize: [100 * 1024, 500 * 1024],
          },
        },

        {
          title: 'Shared Chunks',
          include: ['**/chunk-*.js'],
          thresholds: {
            totalSize: [10, 100 * 1024],
          },
        },
        {
          title: 'CSS Assets',
          include: ['**/*.css'],
          thresholds: {
            totalSize: [1 * 1024, 50 * 1024],
          },
        },
      ],
      penalty: {
        errorWeight: 1,
        warningWeight: 0.5,
        blacklistWeight: 0.5,
      },
      pruning: {
        maxChildren: 10,
        maxDepth: 3,
      },
    }),
  ],
};

export default config;
