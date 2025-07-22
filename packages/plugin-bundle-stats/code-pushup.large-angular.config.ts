import bundleStatsPlugin, { type GroupingRule } from './src';

const nodeModulesGroup: GroupingRule[] = [
  // General node_modules group (processed second due to reverse order)
  { patterns: ['**/node_modules/**', '**/node_modules/@*/**/*'], icon: '📦' },
  // Angular-specific group (processed first due to reverse order, takes precedence)
  {
    patterns: [
      '**/node_modules/@angular/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/@ngrx/**',
      '**/node_modules/ng-*/**',
      '**/node_modules/*angular*',
    ],
    icon: '🅰️',
    maxDepth: 3,
  },
];

const generalGroups: GroupingRule[] = [
  {
    // auto derived title from result
    patterns: ['**/packages/**'],
    icon: '📁',
  },
];

const productGroups: GroupingRule[] = [
  {
    title: 'Payments Package',
    patterns: ['**/packages/payments/**'],
    icon: '💳',
  },
  { title: 'Casino Package', patterns: ['**/packages/casino/**'], icon: '🎰' },
  { title: 'Bingo Package', patterns: ['**/packages/bingo/**'], icon: '🎯' },
  { title: 'Sports Package', patterns: ['**/packages/sports/**'], icon: '⚽' },
  { title: 'Poker Package', patterns: ['**/packages/poker/**'], icon: '🃏' },
  {
    title: 'Lottery Package',
    patterns: ['**/packages/lottery/**'],
    icon: '🎲',
  },
  {
    title: 'Horse Racing Package',
    patterns: ['**/packages/horseracing/**'],
    icon: '🐎',
  },
  { title: 'Oxygen Package', patterns: ['**/packages/oxygen/**'], icon: '🫧' },
  {
    title: 'Engagement Package',
    patterns: ['**/packages/engagement/**'],
    icon: '🎯',
  },
  {
    title: 'My Account Package',
    patterns: ['**/packages/myaccount/**'],
    icon: '👤',
  },
  {
    title: 'Design System Package',
    patterns: ['**/packages/design-system/**'],
    icon: '🎨',
  },
  {
    title: 'Global Search Package',
    patterns: ['**/packages/global-search/**'],
    icon: '🔍',
  },
  { title: 'Gantry Package', patterns: ['**/packages/gantry/**'], icon: '🏗️' },
  {
    title: 'Vanilla Package',
    patterns: ['**/packages/vanilla/**'],
    icon: '🍦',
  },
  { title: 'Promo Package', patterns: ['**/packages/promo/**'], icon: '🎁' },
  {
    title: 'Moka Bingo Package',
    patterns: ['**/packages/mokabingo/**'],
    icon: '🎯',
  },
  {
    title: 'Host App Package',
    patterns: ['**/packages/host-app/**'],
    icon: '🏠',
  },
  {
    title: 'Theme Park Package',
    patterns: ['**/packages/themepark/**'],
    icon: '🎢',
  },
  {
    title: 'Rewards Hub Package',
    patterns: ['**/packages/rewards-hub/**'],
    icon: '🏆',
  },
  {
    title: 'Reporting Package',
    patterns: ['**/packages/reporting/**'],
    icon: '📊',
  },
  {
    title: 'Migration Kit Package',
    patterns: ['**/packages/migration-kit/**'],
    icon: '🔄',
  },
  {
    title: 'Loaders Lib Package',
    patterns: ['**/packages/loaders-lib/**'],
    icon: '📦',
  },
  {
    title: 'GitLab Data Access Package',
    patterns: ['**/packages/gitlab-data-access/**'],
    icon: '🔗',
  },
  {
    title: 'Geo Coordinator Lib Package',
    patterns: ['**/packages/geo-coordinator-lib/**'],
    icon: '🌍',
  },
  {
    title: 'ESBuild Plugins Package',
    patterns: ['**/packages/esbuild-plugins/**'],
    icon: '🔌',
  },
  {
    title: 'ESLint Utils Package',
    patterns: ['**/packages/eslint-utils/**'],
    icon: '🔧',
  },
  {
    title: 'Extractor App Package',
    patterns: ['**/packages/extractor-app/**'],
    icon: '📤',
  },
  {
    title: 'Gantry App Package',
    patterns: ['**/packages/gantry-app/**'],
    icon: '🏗️',
  },
  {
    title: 'Moxxi Test Utils Package',
    patterns: ['**/packages/moxxi-test-utils/**'],
    icon: '🧪',
  },
  {
    title: 'NX Plugin Package',
    patterns: ['**/packages/nx-plugin/**'],
    icon: '⚙️',
  },
  {
    title: 'RTMS Test App Package',
    patterns: ['**/packages/rtms-test-app/**'],
    icon: '🧪',
  },
  {
    title: 'SFAPI Smoke Test Package',
    patterns: ['**/packages/sfapi-smoke-test/**'],
    icon: '💨',
  },
  {
    title: 'Device Atlas Smoke Test Package',
    patterns: ['**/packages/device-atlas-smoke-test/**'],
    icon: '📱',
  },
  {
    title: 'Zendesk Webchat Feature Package',
    patterns: ['**/packages/zendesk-webchat-feature/**'],
    icon: '💬',
  },
  {
    title: 'Dev Kit Package',
    patterns: ['**/packages/dev-kit/**'],
    icon: '🛠️',
  },
];

const badGroups: GroupingRule[] = [
  {
    title: 'Test Web App Package',
    patterns: ['**/packages/testweb-app/**'],
  },
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
  {
    title: 'E2E Test Framework Package',
    patterns: ['**/packages/e2e-test-framework/**'],
    icon: '🧪',
  },
].map(group => ({
  ...group,
  icon: '⚠️',
}));

const config = {
  plugins: [
    await bundleStatsPlugin({
      bundler: 'esbuild',
      artefactsPath:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-large.stats.json',
      selection: {
        excludeOutputs: ['**/*.map'], // Only exclude source maps as they're not part of runtime bundle
      },
      scoring: {
        penalty: {
          // Penalty for individual files that are too large
          // This highlights large files without hiding them
          artefactSize: [0, 3000000], // 0-3MB range - penalty for files > 3MB
          blacklist: [],
        },
      },
      insights: [
        ...productGroups,
        ...badGroups,
        ...generalGroups,
        ...nodeModulesGroup,
      ],
      artefactTree: {
        groups: [
          ...productGroups,
          ...badGroups,
          ...generalGroups,
          ...nodeModulesGroup,
        ],
        pruning: {
          maxDepth: 5,
          minSize: 1_000, // Reduced from 50_000 to show smaller files (1KB threshold)
        },
      },
      audits: [
        /*  {
          title: 'All Files',
          description: 'All files in the bundle',
          selection: {
            includeOutputs: ['**\/*'],
          },
          scoring: {
            // Main bundle size threshold - warn when total exceeds 80MB
            totalSize: 80000000, // 80MB in bytes
          },
          artefactTree: {
            pruning: {
              pathLength: 100,
              maxChildren: 20,
              maxDepth: 3,
            },
          },
        },*/
        // Initial bundle size audit
        {
          title: 'Initial Bundle Size',
          slug: 'initial-bundle-size',
          description:
            'Initial bundle size audit for main and polyfills bundles',
          selection: {
            includeOutputs: [
              '**/main-*.js',
              '**/polyfill-*.js',
              '**/styles-*.css',
            ],
          },
          scoring: {
            totalSize: 80_000_000,
          },
          artefactTree: {
            groups: [
              {
                title: 'Styles',
                patterns: ['**/styles-*.css'],
                icon: '🎨', // Add icon for styles group
                maxDepth: 2, // Enable intermediate folder creation for nested sources
              },
              ...generalGroups,
              ...nodeModulesGroup,
              ...badGroups,
              ...productGroups, // Process product groups first for better specificity (last in array = first processed)
            ],
          },
        },
      ],
    }),
  ],
};

export default config;
