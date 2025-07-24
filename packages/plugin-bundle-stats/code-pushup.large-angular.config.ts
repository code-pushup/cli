import bundleStatsPlugin, {
  type BlacklistEntry,
  type GroupingRule,
} from './src/index.js';

const sharedHint =
  'Remove or conditionally load. Supported natively in modern browsers or replace with modern Angular architecture. See: https://blog.angular.io/zone-less-angular-explained-5fa951ce6f6e';

const blacklist: BlacklistEntry[] = [
  // 🧹 Remove or conditionally load. Supported natively in modern browsers or replace with modern Angular architecture.
  {
    pattern: '**/node_modules/core-js/**',
    hint: sharedHint,
  },
  {
    pattern: '**/node_modules/zone.js/**',
    hint: sharedHint,
  },
  {
    pattern: '**/node_modules/smoothscroll-polyfill/**',
    hint: sharedHint,
  },
  {
    pattern: '**/node_modules/web-animations-js/**',
    hint: sharedHint,
  },

  // 🔁 Replace with modern alternatives
  {
    pattern: '**/node_modules/lodash/**',
    hint: 'Replace with `lodash-es` and use selective imports like `import isEmpty from "lodash-es/isEmpty"`.',
  },
  {
    pattern: '**/node_modules/underscore/**',
    hint: 'Replace with `lodash-es` or native utilities like `Object.keys`, `Array.prototype.map`, etc.',
  },
  {
    pattern: '**/node_modules/decimal.js/**',
    hint: 'Replace with native `BigInt` if full decimal precision isn’t required.',
  },
  {
    pattern: '**/node_modules/angular2-toaster/**',
    hint: 'Replace with actively maintained alternatives like `ngx-toastr` or `ngneat/hot-toast`.',
  },

  // 🕒 Use lazy loading for heavy dependencies
  {
    pattern: '**/node_modules/socket.io-client/**',
    hint: 'Use lazy loading for real-time features. Replace with native WebSocket API or `ws` where possible.',
  },
  {
    pattern: '**/node_modules/launchdarkly-js-client-sdk/**',
    hint: 'Use lazy loading for feature flag SDKs to reduce initial bundle size.',
  },
  {
    pattern: '**/node_modules/@microsoft/**',
    hint: 'Use lazy loading for Microsoft SDKs due to their large size.',
  },
  {
    pattern: '**/node_modules/ngx-toastr/**',
    hint: 'Use lazy loading for notifications. Consider `ngneat/hot-toast` or `notiflix` as lighter alternatives.',
  },
  {
    pattern: '**/node_modules/ngx-scrollbar/**',
    hint: 'Use lazy loading for custom scrollbars. Replace with native CSS where possible.',
  },
  {
    pattern: '**/node_modules/@angular-slider/**',
    hint: 'Use lazy loading for sliders. Consider `ngx-slider-v2` or custom lightweight slider components.',
  },
  {
    pattern: '**/node_modules/howler/**',
    hint: 'Use lazy loading for audio libraries to reduce bundle size.',
  },
  {
    pattern: '**/node_modules/hls.js/**',
    hint: 'Use lazy loading for video streaming libraries like `hls.js`.',
  },
  {
    pattern: '**/node_modules/lottie-web/**',
    hint: 'Use lazy loading for animations. Consider `ngx-lottie` wrapper for Angular.',
  },
  {
    pattern: '**/node_modules/ngx-device-detector/**',
    hint: 'Use lazy loading for device detection logic or move detection server-side.',
  },
  {
    pattern: '**/node_modules/ua-parser-js/**',
    hint: 'Use lazy loading or replace with server-side detection if possible.',
  },

  // 🚫 Exclude from production builds
  {
    pattern: '**/node_modules/@storybook/**',
    hint: 'Exclude Storybook packages from production bundles.',
  },
  {
    pattern: '**/node_modules/jest/**',
    hint: 'Exclude test frameworks like Jest from production builds.',
  },
];

const nodeModulesGroup: GroupingRule[] = [
  // Angular packages (processed first)
  {
    patterns: [
      '**/node_modules/@angular/**', // Catches @angular/core, @angular/common, @angular/router, etc.
      '**/node_modules/@ng*/**', // Catches @ngrx/store, @ngrx/effects, etc.#
      '**/node_modules/@ngx-*/**',
      '**/node_modules/@angular-*/**', // Catches @angular-slider, @angular-devkit, etc.
      '**/node_modules/@*angular*/**', // Catches @rx-angular, @push-based-angular, etc.
    ],
    icon: '🅰️',
    numSegments: 3, // Shows @angular/router, @angular/common, @ngrx/store, etc.
  },
  // Non-scoped Angular packages (processed second)
  {
    patterns: [
      '**/node_modules/ngx-*/**',
      '**/node_modules/ng-*/**',
      '**/node_modules/*angular*/**', // Non-scoped packages containing "angular"
    ],
    icon: '🅰️',
    numSegments: 2, // Shows ngx-toastr, ng-bootstrap, etc.
  },
  // All scoped packages (processed third) - no title allows auto-derivation of individual package names
  {
    patterns: ['**/node_modules/@*/**'],
    icon: '📦',
    numSegments: 3, // Shows @rx-angular/state, @push-based/test-lib, @ngx-translate/core, etc.
  },
  // General node_modules group (processed last - catches everything else)
  {
    title: 'Node Modules',
    patterns: ['**/node_modules/**'],
    icon: '📦',
    numSegments: 1, // Shows individual unscoped packages
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
    title: 'Geo Coordinator Lib Package',
    patterns: ['**/packages/geo-coordinator-lib/**'],
    icon: '🌍',
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

const config = {
  plugins: [
    await bundleStatsPlugin({
      bundler: 'esbuild',
      artifactsPaths:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-large.stats.json',
      selection: {
        excludeOutputs: ['**/*.map', '**/*.d.ts'], // Only exclude source maps as they're not part of runtime bundle
      },
      scoring: {
        penalty: {
          // Penalty for individual files that are too large
          // This highlights large files without hiding them
          artefactSize: [0, 3_000_000], // 0-3MB range - penalty for files > 3MB
          blacklist,
        },
      },
      insightsTable: [
        ...productGroups, // Process product groups first for better specificity
        ...nodeModulesGroup, // Process general node_modules groups last
      ],
      dependencyTree: {
        groups: [
          ...productGroups, // Process product groups first for better specificity
          ...nodeModulesGroup, // Process general node_modules groups last
        ],
        pruning: {
          maxChildren: 10,
          maxDepth: 3,
          minSize: 1_000, // Reduced from 50_000 to show smaller files (1KB threshold)
        },
      },
      audits: [
        {
          title: 'All Files',
          description: 'All files in the bundle',
          selection: {
            // Use specific includeOutputs instead of global include for better control
            includeOutputs: ['**/*'],
            // Exclude patterns to filter out unwanted files
            excludeOutputs: [
              '**/*.map', // Source maps
              '**/*.d.ts', // TypeScript declarations
            ],
          },
          scoring: {
            // Main bundle size threshold - warn when total exceeds 80MB
            totalSize: 80_000_000, // 80MB in bytes
          },
        },
        // Initial bundle size audit
        {
          title: 'Initial Bundle Size',
          description:
            'Initial bundle size audit for main and polyfills bundles as well as styles assets',
          selection: {
            includeOutputs: [
              '**/main-*.js',
              '**/polyfill-*.js',
              '**/styles-*.css',
            ],
          },
          scoring: {
            totalSize: 8_000_000,
          },
        },
      ],
    }),
  ],
};

export default config;
