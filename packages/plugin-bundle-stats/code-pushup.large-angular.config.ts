import bundleStatsPlugin, { DEFAULT_GROUPING } from './src';

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

const GROUPING_PACKAGES = [
  {
    title: 'Payment',
    patterns: ['**/payments/**/*'],
    icon: '🚀',
  },
  {
    title: 'Loaders Library',
    patterns: ['**/loaders-lib/**/*'],
    icon: '🔄',
  },
  {
    title: 'Sports Platform',
    patterns: ['**/sports/**/*'],
    icon: '⚽',
  },
  {
    title: 'Host App',
    patterns: ['**/host-app/**/*'],
    icon: '🏠',
  },
  {
    title: 'Casino',
    patterns: ['**/casino/**/*'],
    icon: '🎰',
  },
  {
    title: 'Oxygen Framework',
    patterns: ['**/oxygen/**/*'],
    icon: '🔧',
  },
];

const GROUPING_ANGULAR_BLOCKS = [
  {
    title: 'Components',
    patterns: ['**/*.component.ts'],
    icon: '🅰️',
  },
  {
    title: 'Directives',
    patterns: ['**/*.directive.ts'],
    icon: '🅰️',
  },
  {
    title: 'Pipes',
    patterns: ['**/*.pipe.ts'],
    icon: '🅰️',
  },
  {
    title: 'Modules',
    patterns: ['**/*.module.ts'],
    icon: '🅰️',
  },
  {
    title: 'Guards',
    patterns: ['**/*.guard.ts'],
    icon: '🅰️',
  },
  {
    title: 'Resolvers',
    patterns: ['**/*.resolver.ts'],
    icon: '🅰️',
  },
  {
    title: 'Interceptors',
    patterns: ['**/*.interceptor.ts'],
    icon: '🅰️',
  },
  {
    title: 'Providers',
    patterns: ['**/*.provider.ts'],
    icon: '🅰️',
  },
  {
    title: 'Services',
    patterns: ['**/*.service.ts'],
    icon: '🅰️',
  },
];

const config = {
  plugins: [
    await bundleStatsPlugin({
      artefactsPath:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-large.stats.json',
      audits: [
        {
          title: 'Initial Bundles',
          selection: {
            includeOutputs: [
              '**/main*.js',
              '**/polyfills*.js',
              '**/runtime*.js',
            ],
          },
          scoring: {
            totalSize: 100_000,
          },
          artefactTree: {
            groups: GROUPING_PACKAGES,
          },
          insights: [
            ...GROUPING_PACKAGES,
            ...GROUPING_ANGULAR_BLOCKS,
            {
              title: 'Node Modules',
              patterns: ['**/node_modules/**/*'],
              icon: '📚',
            },
          ],
        },
      ],
    }),
  ],
};

export default config;
