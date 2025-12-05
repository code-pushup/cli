import type { CoreConfig } from '../models/src/index.js';
import bundleStatsPlugin from './src';

const config: CoreConfig = {
  plugins: [
    await bundleStatsPlugin({
      artifactsPaths:
        'packages/plugin-bundle-stats/mocks/fixtures/stats/esbuild-minimal.sonda-report.json',
      bundler: 'sonda',
      audits: [
        {
          slug: 'bundle-size',
          title: 'Bundle Size Analysis',
          description: 'Analyzes bundle size using Sonda report',
          selection: {
            mode: 'bundle',
            includeOutputs: ['**/*.js'],
          },
          scoring: {
            totalSize: 100_000,
          },
        },
      ],
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: '⚡ Performance',
      description: 'Bundle performance analysis using Sonda',
      refs: [
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'bundle-size',
          weight: 1,
        },
      ],
    },
  ],
};

export default (async () => {
  return config;
})();
