import bundleStatsPlugin from './src';

// npx @code-pushup/cli collect --config packages/plugin-bundle-stats/code-pushup.config.ts
const config = {
  plugins: [
    await bundleStatsPlugin({
      generateArtefacts: {
        command: 'npm',
        args: ['run', 'build:stats'],
        cwd: './packages/plugin-bundle-stats/mocks/fixtures/angular-minimal',
      },
      artefact:
        // minimal angular example
        './packages/plugin-bundle-stats/mocks/fixtures/angular-minimal/dist/angular-minimal/stats.json',
      // real example
      //'./packages/plugin-bundle-stats/mocks/fixtures/stats/esbuild.stats.json',
      bundler: 'esbuild',
      configs: [
        {
          title: 'Initial Bundles',
          include: ['main-*.js', 'polyfills-*.js', '*.css'],
          thresholds: {
            totalSize: [300 * 1024, 1 * 1024 * 1024],
            artefactSize: 500 * 1024,
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
      pruning: {
        startDepth: 1,
        maxChildren: 10,
        maxDepth: 3,
      },
    }),
  ],
};

export default config;
