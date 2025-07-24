import { title } from 'process';
import bundleStatsPlugin, {
  type BlacklistEntry,
  type GroupingRule,
} from './src/index.js';

// ===== REMOVE =====

const toRemoveAsSupportedNatively: string[] = [
  '**/node_modules/core-js/**',
  '**/node_modules/zone.js/**',
  '**/node_modules/smoothscroll-polyfill/**',
  '**/node_modules/web-animations-js/**',
  '**/node_modules/decimal.js/**',
];

const toRemoveFromProduction: string[] = [
  '**/node_modules/@storybook/**',
  '**/node_modules/jest/**',
];

const toReplaceWithLodashEs: string[] = [
  '**/node_modules/lodash/**',
  '**/node_modules/underscore/**',
];

const toReplaceWithAlternatives: string[] = [];

const toReplaceWithDesignSystemUi: string[] = [
  '**/packages/themepark/**',
  '**/node_modules/angular2-toaster/**',
  '**/node_modules/ngx-toastr/**',
  '**/node_modules/@angular-slider/**',
];

// ===== LAZY LOADING =====

const toLazyLoad: string[] = [
  '**/node_modules/socket.io-client/**',
  '**/node_modules/launchdarkly-js-client-sdk/**',
  '**/node_modules/@microsoft/**',
  '**/node_modules/ngx-scrollbar/**',
  '**/node_modules/howler/**',
  '**/node_modules/hls.js/**',
  '**/node_modules/lottie-web/**',
  '**/node_modules/ngx-device-detector/**',
  '**/node_modules/ua-parser-js/**',
];

// ===== BLACKLIST =====

const blacklist: BlacklistEntry[] = [
  ...toRemoveAsSupportedNatively.map(pattern => ({
    pattern,
    hint: 'Remove or conditionally load. Supported natively in modern browsers.',
  })),

  ...toReplaceWithLodashEs.map(pattern => ({
    pattern,
    hint: 'Replace with `lodash-es` and use selective imports like `import isEmpty from "lodash-es/isEmpty"`.',
  })),

  ...toReplaceWithAlternatives.map(pattern => ({
    pattern,
    hint: 'Replace with modern alternatives.',
  })),

  ...toReplaceWithDesignSystemUi.map(pattern => ({
    pattern,
    hint: 'Replace with Design System UI.',
  })),

  ...toLazyLoad.map(pattern => ({
    pattern,
    hint: 'Use lazy loading for heavy dependencies.',
  })),
];

const angularGroup: GroupingRule[] = [
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
];

const thirdPartyGroup: GroupingRule[] = [
  // @pixi
  {
    title: '@pixi',
    patterns: ['**/node_modules/@pixi/**'],
    icon: '📦',
  },
  //lodash-es
  {
    patterns: ['**/node_modules/lodash-es/**'],
    icon: '📦',
    numSegments: 1, // Shows individual unscoped packages
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
    icon: '📁',
    numSegments: 1, // Shows individual unscoped packages
  },
];

const internalPackagesGroup: GroupingRule[] = [
  {
    title: 'Host App Package',
    patterns: ['**/packages/host-app/**'],
    icon: '🟣',
  },
  {
    title: 'Vanilla Package',
    patterns: ['**/packages/vanilla/**'],
    icon: '🟣',
  },
  {
    title: 'Design System Package',
    patterns: ['**/packages/design-system/**'],
    icon: '🟣',
  },
  {
    title: 'Theme Park Package',
    patterns: ['**/packages/themepark/**'],
    icon: '🚫',
  },
  {
    title: 'Dev Kit Package',
    patterns: ['**/packages/dev-kit/**'],
    icon: '🟣',
  },
  {
    title: 'Loaders Lib Package',
    patterns: ['**/packages/loaders-lib/**'],
    icon: '🟣',
  },
  {
    title: 'Geo Coordinator Lib Package',
    patterns: ['**/packages/geo-coordinator-lib/**'],
    icon: '🟣',
  },
  {
    title: 'Engagement Package',
    patterns: ['**/packages/engagement/**'],
    icon: '🟣',
  },
  {
    title: 'Global Search Package',
    patterns: ['**/packages/global-search/**'],
    icon: '🟣',
  },
  {
    title: 'Rewards Hub Package',
    patterns: ['**/packages/rewards-hub/**'],
    icon: '🟣',
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
    title: 'My Account Package',
    patterns: ['**/packages/myaccount/**'],
    icon: '👤',
  },
  { title: 'Promo Package', patterns: ['**/packages/promo/**'], icon: '🎁' },
  {
    title: 'Moka Bingo Package',
    patterns: ['**/packages/mokabingo/**'],
    icon: '🎯',
  },
];

const blacklistGroup: GroupingRule[] = [
  {
    title: 'Blacklist',
    icon: '🚫',
    patterns: [
      ...toRemoveAsSupportedNatively,
      ...toReplaceWithLodashEs,
      ...toReplaceWithAlternatives,
      ...toReplaceWithDesignSystemUi,
      ...toLazyLoad,
      ...toRemoveFromProduction,
    ],
  },
];

// === Audits ===

const allFilesAudit = {
  slug: 'all-files',
  title: '🗂️ All Files',
  description: 'All files in the bundle',
  selection: {
    includeInputs: ['**/*'],
    exclude: ['**/*.map', '**/*.d.ts'],
  },
  scoring: {
    totalSize: 1_000_000_000,
  },
  insightsTable: [
    ...blacklistGroup,
    ...internalPackagesGroup,
    angularGroup.reduce((acc, group) => {
      return {
        ...acc,
        title: 'Angular',
        icon: group.icon,
        patterns: [...(acc?.patterns ?? []), ...(group.patterns ?? [])],
      };
    }, {} as GroupingRule),
    ...productGroups,
    {
      title: 'Node Modules',
      patterns: ['**/node_modules/**'],
      icon: '📁',
    },
  ],
  dependencyTree: {
    groups: [
      ...blacklistGroup,
      ...internalPackagesGroup,
      angularGroup.reduce((acc, group) => {
        return {
          ...acc,
          title: 'Angular',
          icon: group.icon,
          patterns: [...(acc?.patterns ?? []), ...(group.patterns ?? [])],
        };
      }, {} as GroupingRule),
      ...productGroups,
      {
        title: 'Node Modules',
        patterns: ['**/node_modules/**'],
        icon: '📁',
        numSegments: 1,
      },
    ],
    pruning: {
      maxChildren: 40,
      maxDepth: 2,
      minSize: 5_000, // Reduced from 50_000 to show smaller files (1KB threshold)
    },
  },
};

const initialBundleSizeGrouping = [
  ...blacklistGroup,
  ...angularGroup,
  ...internalPackagesGroup,
  ...productGroups,
  ...thirdPartyGroup,
];
const initialBundleSizeAudit = {
  slug: 'initial-bundle-size',
  title: '🔥 Initial Bundle Size',
  description:
    'Initial bundle size audit for main and polyfills bundles as well as styles assets',
  selection: {
    includeOutputs: ['**/main-*.js', '**/polyfill-*.js', '**/styles-*.css'],
  },
  scoring: {
    totalSize: 1_000_000,
    penalty: {
      artefactSize: [100, 100_000],
    },
  },
  insightsTable: initialBundleSizeGrouping,
  dependencyTree: {
    groups: initialBundleSizeGrouping,
    pruning: {
      maxChildren: 20,
      maxDepth: 2,
    },
  },
};

const blacklistedFilesAudit = {
  slug: 'blacklisted',
  title: '🚫 Blacklisted',
  description: 'All chunks containing blacklisted files',
  scoring: {
    totalSize: 1_000_000_000,
    penalty: {
      blacklist,
      warningWeight: 0,
      errorWeight: 0,
    },
  },
  selection: {
    includeInputs: blacklistGroup.at(0)?.patterns ?? [],
    excludeInputs: ['**/*.map', '**/*.d.ts'], // Exclude maps and type files
  },
  insightsTable: [
    ...blacklistGroup,
    {
      title: 'Not Blacklisted',
      patterns: ['**/*'],
      icon: '✅',
    },
  ],
  dependencyTree: {
    groups: [
      // derive title per package
      ...blacklistGroup.map(({ title, ...rest }) => rest),
      {
        title: 'Not Blacklisted',
        patterns: ['**/*'],
        icon: '✅',
      },
    ],
    pruning: {
      maxChildren: 7,
      maxDepth: 2,
    },
  },
};

const lazyChunksAudit = {
  slug: 'lazy-chunks',
  title: '⏳ Lazy Loaded Chunks',
  description:
    'Analyze lazy-loaded chunks and their sizes for performance optimization',
  selection: {
    includeOutputs: ['**/*-lazy-*.js', '**/chunk-*.js'],
    excludeOutputs: ['**/main-*.js', '**/polyfill-*.js', '**/vendor-*.js'],
  },
  scoring: {
    totalSize: 500_000, // 500KB threshold for lazy chunks
    penalty: {
      artefactSize: [50_000, 200_000], // Warn at 50KB, error at 200KB
    },
  },
  insightsTable: [
    ...productGroups,
    ...internalPackagesGroup,
    {
      title: 'Third Party (Lazy)',
      patterns: ['**/node_modules/**'],
      icon: '📦',
    },
  ],
  dependencyTree: {
    groups: [...productGroups, ...internalPackagesGroup, ...thirdPartyGroup],
    pruning: {
      maxChildren: 15,
      maxDepth: 2,
    },
  },
};

const angularSpecificAudit = {
  slug: 'angular-ecosystem',
  title: '🅰️ Angular Ecosystem',
  description: 'Angular core, common, router, and ecosystem packages analysis',
  selection: {
    includeInputs: [
      '**/node_modules/@angular/**',
      '**/node_modules/@ng*/**',
      '**/node_modules/@ngx-*/**',
      '**/node_modules/@angular-*/**',
      '**/node_modules/@*angular*/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/ng-*/**',
      '**/node_modules/*angular*/**',
    ],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  scoring: {
    totalSize: 800_000, // 800KB budget for Angular ecosystem
    penalty: {
      artefactSize: [200_000, 500_000],
    },
  },
  insightsTable: angularGroup,
  dependencyTree: {
    groups: angularGroup,
    pruning: {
      maxChildren: 25,
      maxDepth: 3,
    },
  },
};

const thirdPartyDependenciesAudit = {
  slug: 'third-party-deps',
  title: '📦 Third Party Dependencies',
  description: 'External node_modules dependencies size analysis',
  selection: {
    includeInputs: ['**/node_modules/**'],
    excludeInputs: [
      '**/*.map',
      '**/*.d.ts',
      // Exclude Angular packages as they have their own audit
      '**/node_modules/@angular/**',
      '**/node_modules/@ng*/**',
      '**/node_modules/@ngx-*/**',
      '**/node_modules/@angular-*/**',
      '**/node_modules/@*angular*/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/ng-*/**',
      '**/node_modules/*angular*/**',
    ],
  },
  scoring: {
    totalSize: 1_500_000, // 1.5MB budget for third-party deps
    penalty: {
      artefactSize: [100_000, 300_000],
    },
  },
  insightsTable: thirdPartyGroup,
  dependencyTree: {
    groups: thirdPartyGroup,
    pruning: {
      maxChildren: 30,
      maxDepth: 2,
    },
  },
};

const internalPackagesAudit = {
  slug: 'internal-packages',
  title: '🟣 Internal Packages',
  description: 'Analysis of internal company packages and their dependencies',
  selection: {
    includeInputs: ['**/packages/**'],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  scoring: {
    totalSize: 2_000_000, // 2MB budget for internal packages
    penalty: {
      artefactSize: [200_000, 500_000],
    },
  },
  insightsTable: [...internalPackagesGroup, ...productGroups],
  dependencyTree: {
    groups: [...internalPackagesGroup, ...productGroups],
    pruning: {
      maxChildren: 20,
      maxDepth: 3,
    },
  },
};

const largeFilesAudit = {
  slug: 'large-files',
  title: '🐘 Large Files',
  description: 'Files larger than 100KB that may need optimization',
  selection: {
    includeInputs: ['**/*'],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  scoring: {
    totalSize: 10_000_000, // High threshold since we're looking at large files
    penalty: {
      artefactSize: [100_000, 500_000], // Flag files > 100KB, error > 500KB
    },
  },
  insightsTable: [
    ...blacklistGroup,
    ...internalPackagesGroup,
    ...productGroups,
    {
      title: 'Large Third Party',
      patterns: ['**/node_modules/**'],
      icon: '📦',
    },
    {
      title: 'Other Large Files',
      patterns: ['**/*'],
      icon: '📄',
    },
  ],
  dependencyTree: {
    groups: [
      ...blacklistGroup,
      ...internalPackagesGroup,
      ...productGroups,
      ...thirdPartyGroup,
    ],
    pruning: {
      maxChildren: 10,
      maxDepth: 2,
      minSize: 100_000, // Only show files > 100KB
    },
  },
};

const polyfillsAudit = {
  slug: 'polyfills',
  title: '🔧 Polyfills',
  description:
    'Polyfills analysis - identify what can be removed for modern browsers',
  selection: {
    includeOutputs: ['**/polyfill-*.js'],
    includeInputs: [
      '**/node_modules/core-js/**',
      '**/node_modules/zone.js/**',
      '**/node_modules/smoothscroll-polyfill/**',
      '**/node_modules/web-animations-js/**',
      '**/node_modules/decimal.js/**',
    ],
  },
  scoring: {
    totalSize: 200_000, // 200KB budget for polyfills
    penalty: {
      blacklist: toRemoveAsSupportedNatively.map(pattern => ({
        pattern,
        hint: 'Remove or conditionally load. Supported natively in modern browsers.',
      })),
      artefactSize: [50_000, 150_000],
    },
  },
  insightsTable: [
    {
      title: 'Removable Polyfills',
      patterns: toRemoveAsSupportedNatively,
      icon: '🚫',
    },
    {
      title: 'Other Polyfills',
      patterns: ['**/*'],
      icon: '🔧',
    },
  ],
  dependencyTree: {
    groups: [
      {
        title: 'Removable Polyfills',
        patterns: toRemoveAsSupportedNatively,
        icon: '🚫',
      },
      {
        title: 'Other Polyfills',
        patterns: ['**/*'],
        icon: '🔧',
        numSegments: 2,
      },
    ],
    pruning: {
      maxChildren: 15,
      maxDepth: 2,
    },
  },
};

const assetsAudit = {
  slug: 'assets',
  title: '🖼️ Static Assets',
  description: 'Images, fonts, and other static assets analysis',
  selection: {
    includeOutputs: [
      '**/*.png',
      '**/*.jpg',
      '**/*.jpeg',
      '**/*.gif',
      '**/*.svg',
      '**/*.woff',
      '**/*.woff2',
      '**/*.ttf',
      '**/*.eot',
      '**/*.ico',
      '**/*.webp',
      '**/*.avif',
    ],
  },
  scoring: {
    totalSize: 3_000_000, // 3MB budget for assets
    penalty: {
      artefactSize: [500_000, 1_000_000], // Warn at 500KB, error at 1MB for individual assets
    },
  },
  insightsTable: [
    {
      title: 'Images',
      patterns: [
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.gif',
        '**/*.svg',
        '**/*.webp',
        '**/*.avif',
      ],
      icon: '🖼️',
    },
    {
      title: 'Fonts',
      patterns: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
      icon: '🔤',
    },
    {
      title: 'Other Assets',
      patterns: ['**/*.ico', '**/*'],
      icon: '📄',
    },
  ],
  dependencyTree: {
    groups: [
      {
        title: 'Images',
        patterns: [
          '**/*.png',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.gif',
          '**/*.svg',
          '**/*.webp',
          '**/*.avif',
        ],
        icon: '🖼️',
      },
      {
        title: 'Fonts',
        patterns: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],
        icon: '🔤',
      },
      {
        title: 'Other Assets',
        patterns: ['**/*'],
        icon: '📄',
      },
    ],
    pruning: {
      maxChildren: 20,
      maxDepth: 1,
      minSize: 10_000, // Show assets > 10KB
    },
  },
};

const config = {
  plugins: [
    await bundleStatsPlugin({
      bundler: 'esbuild',
      artifactsPaths:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-large.stats.json',
      selection: {
        excludeOutputs: ['**/*.map', '**/*.d.ts'], // Only exclude source maps as they're not part of runtime bundle
      },
      audits: [
        allFilesAudit,
        initialBundleSizeAudit,
        blacklistedFilesAudit,
        lazyChunksAudit,
        angularSpecificAudit,
        thirdPartyDependenciesAudit,
        internalPackagesAudit,
        largeFilesAudit,
        polyfillsAudit,
        assetsAudit,
      ],
    }),
  ],
};

export default config;
