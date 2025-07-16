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

const groups = [
  { title: 'Payments Package', patterns: ['**/packages/payments/**'], icon: '💳' },
  { title: 'Casino Package', patterns: ['**/packages/casino/**'], icon: '🎰' },
  { title: 'Bingo Package', patterns: ['**/packages/bingo/**'], icon: '🎯' },
  { title: 'Sports Package', patterns: ['**/packages/sports/**'], icon: '⚽' },
  { title: 'Poker Package', patterns: ['**/packages/poker/**'], icon: '🃏' },
  { title: 'Lottery Package', patterns: ['**/packages/lottery/**'], icon: '🎲' },
  { title: 'Horse Racing Package', patterns: ['**/packages/horseracing/**'], icon: '🐎' },
  { title: 'Oxygen Package', patterns: ['**/packages/oxygen/**'], icon: '🫧' },
  { title: 'Engagement Package', patterns: ['**/packages/engagement/**'], icon: '🎯' },
  { title: 'My Account Package', patterns: ['**/packages/myaccount/**'], icon: '👤' },
  { title: 'Design System Package', patterns: ['**/packages/design-system/**'], icon: '🎨' },
  { title: 'Global Search Package', patterns: ['**/packages/global-search/**'], icon: '🔍' },
  { title: 'Gantry Package', patterns: ['**/packages/gantry/**'], icon: '🏗️' },
  { title: 'Vanilla Package', patterns: ['**/packages/vanilla/**'], icon: '🍦' },
  { title: 'Promo Package', patterns: ['**/packages/promo/**'], icon: '🎁' },
  { title: 'Moka Bingo Package', patterns: ['**/packages/mokabingo/**'], icon: '🎯' },
  { title: 'Host App Package', patterns: ['**/packages/host-app/**'], icon: '🏠' },
  { title: 'Test Web App Package', patterns: ['**/packages/testweb-app/**'], icon: '🧪' },
  { title: 'Theme Park Package', patterns: ['**/packages/themepark/**'], icon: '🎢' },
  { title: 'Rewards Hub Package', patterns: ['**/packages/rewards-hub/**'], icon: '🏆' },
  { title: 'Reporting Package', patterns: ['**/packages/reporting/**'], icon: '📊' },
  { title: 'Migration Kit Package', patterns: ['**/packages/migration-kit/**'], icon: '🔄' },
  { title: 'Loaders Lib Package', patterns: ['**/packages/loaders-lib/**'], icon: '📦' },
  { title: 'GitLab Data Access Package', patterns: ['**/packages/gitlab-data-access/**'], icon: '🔗' },
  { title: 'Geo Coordinator Lib Package', patterns: ['**/packages/geo-coordinator-lib/**'], icon: '🌍' },
  { title: 'ESBuild Plugins Package', patterns: ['**/packages/esbuild-plugins/**'], icon: '🔌' },
  { title: 'ESLint Utils Package', patterns: ['**/packages/eslint-utils/**'], icon: '🔧' },
  { title: 'Extractor App Package', patterns: ['**/packages/extractor-app/**'], icon: '📤' },
  { title: 'Gantry App Package', patterns: ['**/packages/gantry-app/**'], icon: '🏗️' },
  { title: 'Moxxi Test Utils Package', patterns: ['**/packages/moxxi-test-utils/**'], icon: '🧪' },
  { title: 'NX Plugin Package', patterns: ['**/packages/nx-plugin/**'], icon: '⚙️' },
  { title: 'RTMS Test App Package', patterns: ['**/packages/rtms-test-app/**'], icon: '🧪' },
  { title: 'SFAPI Smoke Test Package', patterns: ['**/packages/sfapi-smoke-test/**'], icon: '💨' },
  { title: 'Device Atlas Smoke Test Package', patterns: ['**/packages/device-atlas-smoke-test/**'], icon: '📱' },
  { title: 'Zendesk Webchat Feature Package', patterns: ['**/packages/zendesk-webchat-feature/**'], icon: '💬' },
  { title: 'Dev Kit Package', patterns: ['**/packages/dev-kit/**'], icon: '🛠️' },
  { title: 'E2E Test Framework Package', patterns: ['**/packages/e2e-test-framework/**'], icon: '🧪' },
  { title: 'Node Modules', patterns: ['**/node_modules/**'], icon: '📦' },
];

const config = {
  plugins: [
    await bundleStatsPlugin({
      bundler: 'esbuild',
      artefactsPath:
        './packages/plugin-bundle-stats/mocks/fixtures/angular-large/dist/angular-large/stats.json',
      audits: [
        {
          title: 'all',
          selection: {
            includeOutputs: ['**/*'],
            excludeOutputs: ['**/*.map'], // Only exclude source maps as they're not part of runtime bundle
          },
          scoring: {
            // Main bundle size threshold - warn when total exceeds 80MB
            totalSize: 80000000, // 80MB in bytes
            penalty: {
              // Penalty for individual files that are too large
              // This highlights large files without hiding them
              artefactSize: [0, 3000000], // 0-3MB range - penalty for files > 3MB

              // NO BLACKLIST - we want to see everything, especially problematic files
              blacklist: [],
            },
          },
          insights: [
            // 🚨 CRITICAL: Files that shouldn't be in production - these are important findings!
            {
              title: '🚨 Test Files in Production',
              patterns: [
                '**/node_modules/**/*.test.js',
                '**/node_modules/**/*.spec.js',
                '**/node_modules/**/test/**',
                '**/node_modules/**/tests/**',
                '**/node_modules/**/__tests__/**',
              ],
              icon: '⚠️',
            },
            {
              title: '📚 Documentation in Bundle',
              patterns: [
                '**/node_modules/**/demo/**',
                '**/node_modules/**/examples/**',
                '**/node_modules/**/docs/**',
                '**/node_modules/**/*.md',
                '**/node_modules/**/README*',
                '**/node_modules/**/CHANGELOG*',
                '**/node_modules/**/LICENSE*',
              ],
              icon: '📄',
            },
            {
              title: '🛠️ Dev Tools in Production',
              patterns: [
                '**/node_modules/**/webpack.config.js',
                '**/node_modules/**/rollup.config.js',
                '**/node_modules/**/jest.config.js',
                '**/node_modules/**/.eslintrc*',
                '**/node_modules/**/.babelrc*',
                '**/node_modules/**/tsconfig*.json',
              ],
              icon: '🔧',
            },
            ...groups,
          ],
          artefactTree: {
            groups: [...groups],
            pruning: {
              maxChildren: 20,
              maxDepth: 3,
              minSize: 50_000,
            },
          },
        },
      ],
    }),
  ],
};

export default config;
