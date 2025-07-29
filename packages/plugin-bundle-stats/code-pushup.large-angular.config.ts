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

const toReplaceWithLodashEs: string[] = ['**/node_modules/lodash/**'];

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
  ...toReplaceWithLodashEs.map(pattern => ({
    pattern,
    hint: 'Replace with `lodash-es` and use selective imports like `import isEmpty from "lodash-es/isEmpty"`.',
  })),

  ...toReplaceWithAlternatives.map(pattern => ({
    pattern,
    hint: 'Replace with modern alternatives.',
  })),

  ...toLazyLoad.map(pattern => ({
    pattern,
    hint: 'Use lazy loading for heavy dependencies.',
  })),
];

// ===== Legacy BLACKLIST =====

const legacyBlacklist: BlacklistEntry[] = [
  ...toRemoveAsSupportedNatively.map(pattern => ({
    pattern,
    hint: 'Remove or conditionally load. Supported natively in modern browsers.',
  })),

  ...toRemoveFromProduction.map(pattern => ({
    pattern,
    hint: 'Remove from production builds.',
  })),
];

const angularGroups: GroupingRule[] = [
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

const thirdPartyGroups: GroupingRule[] = [
  {
    title: 'lodash-es',
    patterns: ['**/node_modules/lodash-es/**'],
    icon: '📦',
  },
  {
    title: '@pixi',
    patterns: ['**/node_modules/@pixi/**', '**/node_modules/pixi-*/**'],
    icon: '📦',
  },

  {
    title: 'rxjs',
    patterns: ['**/node_modules/rxjs/**'],
    icon: '📦',
  },

  // All scoped packages (processed third) - no title allows auto-derivation of individual package names
  {
    patterns: ['**/node_modules/@*/**'],
    icon: '📦',
    numSegments: 2,
  },
];

const knownNodeModules: string[] = [
  ...toLazyLoad,
  ...toRemoveAsSupportedNatively,
  ...toReplaceWithLodashEs,
  ...toReplaceWithAlternatives,
  ...toReplaceWithDesignSystemUi,
  ...toRemoveFromProduction,
  ...angularGroups.map(group => group.patterns).flat(),
  ...thirdPartyGroups.map(group => group.patterns).flat(),

  // new findings here
  '**/node_modules/@incodetech/**',
  '**/node_modules/scheduler/**',
  '**/node_modules/@jumio/**',
  '**/node_modules/gsap/**',
  '**/node_modules/@img-arena/**',
  '**/node_modules/@rtms/**',
  '**/node_modules/@floating-ui/**',
  '**/node_modules/@push-based/**',
  '**/node_modules/jspdf/**',
  '**/node_modules/braintree-web/**',
  '**/node_modules/html2canvas/**',
  '**/node_modules/swiper/**',
  '**/node_modules/canvg/**',
  '**/node_modules/xml2js/**',
  '**/node_modules/buffer/**',
  '**/node_modules/bwin-winwheel/**',
  '**/node_modules/dompurify/**',
  '**/node_modules/hammerjs/**',
  '**/node_modules/sax/**',
  '**/node_modules/svg-pathdata/**',
  '**/node_modules/fast-json-patch/**',
  '**/node_modules/tslib/**',
  '**/node_modules/url/**',

  '**/node_modules/call-bind-apply-helpers/**',
  '**/node_modules/performance-now/**',
  '**/node_modules/custom-event-js/**',
  '**/node_modules/subsink/**',
  '**/node_modules/get-proto/**',
  '**/node_modules/yeast/**',
  '**/node_modules/es-errors/**',
  '**/node_modules/dunder-proto/**',
  '**/node_modules/side-channel/**',
  '**/node_modules/parseqs/**',
  '**/node_modules/mitt/**',
  '**/node_modules/arraybuffer.slice/**',
  '**/node_modules/component-bind/**',
  '**/node_modules/after/**',
  '**/node_modules/call-bound/**',
  '**/node_modules/gopd/**',
  '**/node_modules/indexof/**',

  '**/node_modules/stream/**',
  '**/node_modules/component-emitter/**',
  '**/node_modules/parseuri/**',
  '**/node_modules/blob/**',
  '**/node_modules/ieee754/**',
  '**/node_modules/has-binary2/**',

  '**/node_modules/primeng/**',
  '**/node_modules/dexie/**',
  '**/node_modules/canvas-confetti/**',
  '**/node_modules/cssfilter/**',
  '**/node_modules/object-inspect/**',
  '**/node_modules/xss/**',
  '**/node_modules/cds-client/**',
  '**/node_modules/get-intrinsic/**',
  '**/node_modules/events/**',
  '**/node_modules/pixi/**',
  '**/node_modules/css-element-queries/**',
  '**/node_modules/blueimp-md5/**',
  '**/node_modules/string_decoder/**',
  '**/node_modules/dijkstrajs/**',
  '**/node_modules/has-symbols/**',
  '**/node_modules/braintree-web/**',
];

const allNodeModulesInOneGroup: GroupingRule = {
  title: 'Node Modules',
  patterns: ['**/node_modules/**'],
  icon: '📁',
};

const selectAll = (opt: { title?: string; icon?: string }): GroupingRule => {
  return {
    ...(opt.title && { title: opt.title }),
    ...(opt.icon && { icon: opt.icon }),
    patterns: ['**/*'],
  };
};

const namedInternalPackagesGroups: GroupingRule[] = [
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
];

const allPackagesGroup: GroupingRule = {
  patterns: ['**/packages/**'],
  icon: '🟣',
  numSegments: 2,
};

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

const allBlacklistGroup: GroupingRule = {
  title: 'Blacklist',
  icon: '🚫',
  patterns: [
    ...blacklist.map(item => (typeof item === 'string' ? item : item.pattern)),
    ...legacyBlacklist.map(item =>
      typeof item === 'string' ? item : item.pattern,
    ),
  ],
};

// === Audits ===

const allFilesAudit = {
  slug: 'all-files',
  title: '🗂️ All Files',
  description: `
Analyzes **complete bundle composition**, identifies **architectural patterns**, tracks **package distribution**, and reveals **size contributors** across all bundle artifacts.`,
  selection: {
    includeStaticImports: false,
    includeInputs: ['**/*'],
    exclude: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: [
    allBlacklistGroup,
    ...namedInternalPackagesGroups,
    allPackagesGroup,
    angularGroups.reduce((acc, group) => {
      return {
        ...acc,
        title: 'Angular',
        icon: group.icon,
        patterns: [...(acc?.patterns ?? []), ...(group.patterns ?? [])],
      };
    }, {} as GroupingRule),
    ...productGroups,
    allNodeModulesInOneGroup,
  ],
  dependencyTree: false /*{
    groups: [
      ...blacklistGroup,
          ...namedInternalPackagesGroups,
      allPackagesGroup,
      angularGroup.reduce((acc, group) => {
        return {
          ...acc,
          title: 'Angular',
          icon: group.icon,
          patterns: [...(acc?.patterns ?? []), ...(group.patterns ?? [])],
        };
      }, {} as GroupingRule),
      ...productGroups,
      allNodeModulesInOneGroup,
    ],
    pruning: {
      maxChildren: 40,
      maxDepth: 2,
      minSize: 5_000, // Reduced from 50_000 to show smaller files (1KB threshold)
    },
  },*/,
};

const initialBundleSizeGroups = [
  allBlacklistGroup,
  ...angularGroups,
  ...namedInternalPackagesGroups,
  allPackagesGroup,
  ...productGroups,
  ...thirdPartyGroups,
];
const initialBundleSizeAudit = {
  slug: 'initial-bundle-size',
  title: '🔥 Initial Bundle Size',
  description: `
Monitors **critical loading performance**, enforces **size budgets**, detects **bloat sources**, and prevents **slow startup times** in main application bundles.`,
  selection: {
    includeOutputs: ['**/main-*.js', '**/polyfill-*.js', '**/styles-*.css'],
  },
  scoring: {
    totalSize: 1_000_000,
    penalty: {
      artefactSize: [100, 100_000],
    },
  },
  insightsTable: initialBundleSizeGroups,
  dependencyTree: {
    groups: initialBundleSizeGroups,
    pruning: {
      maxChildren: 20,
      maxDepth: 2,
    },
  },
};

const blacklistedFilesAudit = {
  slug: 'blacklisted',
  title: '🚫 Blacklisted',
  description: `
Detects **blacklisted dependencies**, enforces **architectural standards**, prevents **security vulnerabilities**, and blocks **performance bottlenecks** from reaching production.`,
  scoring: {
    penalty: {
      blacklist,
      warningWeight: 0,
      errorWeight: 0,
    },
  },
  selection: {
    includeStaticImports: false,
    includeInputs: allBlacklistGroup.patterns,
    excludeInputs: ['**/*.map', '**/*.d.ts'], // Exclude maps and type files
  },
  insightsTable: [
    allBlacklistGroup,
    selectAll({ title: 'Not Blacklisted', icon: '✅' }),
  ],
  dependencyTree: false,
};

const legacyAngularGroups: GroupingRule[] = [
  {
    patterns: [
      '**/node_modules/@ng-bootstrap/**',
      '**/node_modules/ngx-toastr/**',
    ],
    icon: '🚫',
    numSegments: 2,
  },
];
const angularSpecificAudit = {
  slug: 'angular-ecosystem',
  title: '🅰️ Angular Ecosystem',
  description: `
Tracks **Angular framework usage**, optimizes **tree-shaking opportunities**, identifies **duplicate Angular modules**, and prevents **framework bloat** in Angular applications.`,
  selection: {
    includeStaticImports: false,
    inputsOnly: true,
    includeInputs: angularGroups.map(group => group.patterns).flat(),
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: [
    ...legacyAngularGroups,
    ...angularGroups.map(group => ({
      ...group,
      icon: ' ',
    })),
  ],
  dependencyTree: {
    groups: [
      ...legacyAngularGroups,
      ...angularGroups,
      selectAll({ title: 'Rest', icon: '📁' }),
    ],
    pruning: {
      maxChildren: 25,
      maxDepth: 2,
    },
  },
};

const knownNodeModulesBlacklistedGroup: GroupingRule = {
  title: 'Legacy Packages',
  icon: '📦🚫',
  patterns: [
    ...blacklist.map(item => (typeof item === 'string' ? item : item.pattern)),
    ...legacyBlacklist.map(item =>
      typeof item === 'string' ? item : item.pattern,
    ),
  ],
  numSegments: 2,
};
const knownNodeModulesApprovedGroup: GroupingRule = {
  title: 'Packages',
  icon: '📦',
  patterns: knownNodeModules,
  numSegments: undefined,
};
const newBlacklistedNodeModulesGroup: GroupingRule = {
  icon: '🆕🚫',
  patterns: blacklist
    .map(item => (typeof item === 'string' ? item : item.pattern))
    .concat(['**/node_modules/underscore/**']),
  numSegments: 2,
};

const everythingElseGroup: GroupingRule = {
  title: 'Rest',
  icon: '📁',
  patterns: ['!**/node_modules/**'],
  numSegments: undefined,
};
const newNodeModulesGroup: GroupingRule = {
  icon: '🆕',
  patterns: ['**/node_modules/**'],
  numSegments: 2,
};

const nodeModulesAudit = {
  slug: 'node-modules',
  title: '📦 Node Modules',
  description: `
Detects *newly added packages*, catches **forbidden dependencies**, monitors **3rd party costs**, and prevents **bundle bloat** from unreviewed dependencies.`,
  selection: {
    includeStaticImports: false,
    includeInputs: ['**/node_modules/**'],
  },
  insightsTable: [
    knownNodeModulesBlacklistedGroup,
    knownNodeModulesApprovedGroup,
    newBlacklistedNodeModulesGroup,
    newNodeModulesGroup,
  ],
  dependencyTree: {
    groups: [
      knownNodeModulesBlacklistedGroup,
      knownNodeModulesApprovedGroup,
      newBlacklistedNodeModulesGroup,
      {
        ...everythingElseGroup,
        patterns: [
          ...knownNodeModulesApprovedGroup.patterns,
          ...everythingElseGroup.patterns,
        ],
      },
      newNodeModulesGroup,
    ],
    pruning: {
      maxChildren: 10,
      maxDepth: 2,
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
        angularSpecificAudit,
        nodeModulesAudit,
      ],
    }),
  ],
};

export default config;
