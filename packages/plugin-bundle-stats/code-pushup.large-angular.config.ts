import bundleStatsPlugin from './src/index.js';
import { BundleStatsAuditOptions } from './src/lib/types.js';

type PatternList = string[];

// Only allow numbers greater than 1
type ValidSegmentDepth = Exclude<number, 0 | 1 | undefined>;

/**
 * Base grouping rule without segment constraints
 */
type BaseGroupingRule = {
  icon?: string;
  include: string | PatternList;
  exclude?: string | PatternList;
};

/**
 * Rule that derives title from numSegments (must be > 1)
 */
type GroupingRuleWithAutoTitle = BaseGroupingRule & {
  numSegments: ValidSegmentDepth;
  title?: string; // optional since it's derived
};

/**
 * Rule that requires a manual title if numSegments is not valid
 */
type GroupingRuleWithManualTitle = BaseGroupingRule & {
  numSegments?: 1 | undefined;
  title: string; // required fallback
};

/**
 * Final union type to enforce logic
 */
export type GroupingRule =
  | GroupingRuleWithAutoTitle
  | GroupingRuleWithManualTitle;

const allFilesGroups: GroupingRule[] = [
  {
    title: 'Internal Packages',
    include: ['**/packages/**'],
    icon: '🟣',
    numSegments: 1,
  },
  {
    title: 'External Dependencies',
    include: ['**/node_modules/**'],
    icon: '📦',
    numSegments: 1,
  },
];

const allFilesAudit: BundleStatsAuditOptions = {
  slug: 'all-files',
  title: '🗂️ All Files',
  description: `
Analyzes **complete bundle composition**, identifies **architectural patterns**, tracks **package distribution**, and reveals **size contributors** across all bundle artifacts.`,
  selection: {
    mode: 'bundle',
    includeOutputs: ['**/*'],
    exclude: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: {
    mode: 'all',
    groups: allFilesGroups,
  },
  dependencyTree: { enabled: false },
};

const initialBundleSizeTableGroups: GroupingRule[] = [
  {
    title: 'Blacklisted/Deprecated',
    icon: '🚫',
    include: [
      '**/node_modules/lodash/**',
      '**/node_modules/core-js/**',
      '**/node_modules/zone.js/**',
      '**/node_modules/smoothscroll-polyfill/**',
      '**/node_modules/web-animations-js/**',
      '**/node_modules/decimal.js/**',
      '**/node_modules/@storybook/**',
      '**/node_modules/jest/**',
      '**/packages/themepark/**',
    ],
  },
  {
    title: 'Lazy-loaded',
    icon: '⏳',
    include: [
      '**/node_modules/socket.io-client/**',
      '**/node_modules/launchdarkly-js-client-sdk/**',
      '**/node_modules/@microsoft/**',
      '**/node_modules/ngx-scrollbar/**',
      '**/node_modules/howler/**',
      '**/node_modules/hls.js/**',
      '**/node_modules/lottie-web/**',
      '**/node_modules/ngx-device-detector/**',
      '**/node_modules/ua-parser-js/**',
    ],
  },
  {
    title: 'Angular',
    include: [
      '**/node_modules/*angular*/**',
      '**/node_modules/@ng*/**',
      '**/node_modules/@ngx-*/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/ng-*/**',
    ],
    icon: '🅰️',
    numSegments: 2,
  },
  {
    title: 'Third-party',
    icon: '📚',
    include: [
      '**/node_modules/react/**',
      '**/node_modules/lodash-es/**',
      '**/node_modules/rxjs/**',
      '**/node_modules/moment/**',
      '**/node_modules/dayjs/**',
    ],
    numSegments: 2,
  },
  {
    title: 'Product',
    icon: '🎮',
    include: [
      '**/packages/payments/**',
      '**/packages/casino/**',
      '**/packages/bingo/**',
      '**/packages/sports/**',
      '**/packages/poker/**',
      '**/packages/lottery/**',
      '**/packages/horseracing/**',
      '**/packages/oxygen/**',
      '**/packages/myaccount/**',
      '**/packages/promo/**',
      '**/packages/mokabingo/**',
    ],
    numSegments: 2,
  },
  {
    title: 'Internal utils',
    icon: '🔧',
    include: [
      '**/packages/design-system/**',
      '**/packages/utils/**',
      '**/packages/shared/**',
      '**/packages/common/**',
    ],
  },
  {
    title: 'Node modules',
    include: ['**/node_modules/**'],
    icon: '📦',
  },
];

const initialBundleSizeTreeGroups: GroupingRule[] = [
  {
    include: ['**/node_modules/*angular*/**'],
    icon: '🅰️',
    numSegments: 2,
  },
  {
    title: 'Design System',
    include: ['**/packages/design-system/**'],
    icon: '🟣',
  },
  {
    title: 'Deprecated Theme',
    include: ['**/packages/themepark/**'],
    icon: '🚫',
  },
  {
    include: ['**/packages/**'],
    icon: '🟣',
    numSegments: 2,
  },
  {
    title: 'Payments',
    include: ['**/packages/payments/**'],
    icon: '💳',
  },
  {
    title: 'Casino',
    include: ['**/packages/casino/**'],
    icon: '🎰',
  },
  {
    title: 'Bingo',
    include: ['**/packages/bingo/**'],
    icon: '🎯',
  },
  {
    title: 'Sports',
    include: ['**/packages/sports/**'],
    icon: '⚽',
  },
  {
    title: 'Poker',
    include: ['**/packages/poker/**'],
    icon: '🃏',
  },
  {
    title: 'Lottery',
    include: ['**/packages/lottery/**'],
    icon: '🎲',
  },
  {
    title: 'Horse Racing',
    include: ['**/packages/horseracing/**'],
    icon: '🐎',
  },
  {
    title: 'Oxygen',
    include: ['**/packages/oxygen/**'],
    icon: '🫧',
  },
  {
    title: 'My Account',
    include: ['**/packages/myaccount/**'],
    icon: '👤',
  },
  {
    title: 'Promotions',
    include: ['**/packages/promo/**'],
    icon: '🎁',
  },
  {
    title: 'Moka Bingo',
    include: ['**/packages/mokabingo/**'],
    icon: '🎯',
  },
  {
    title: 'React',
    include: ['**/node_modules/react/**'],
    icon: '⚛️',
  },
  {
    title: 'Lodash ES',
    include: ['**/node_modules/lodash-es/**'],
    icon: '🔧',
  },
  {
    title: 'Node Modules',
    include: ['**/node_modules/**'],
    numSegments: 2,
  },
];

const initialBundleSizeAudit: BundleStatsAuditOptions = {
  slug: 'initial-bundle-size',
  title: '🔥 Initial Bundle Size',
  description: `
Monitors **critical loading performance**, enforces **size budgets**, detects **bloat sources**, and prevents **slow startup times** in main application bundles.`,
  selection: {
    mode: 'startup',
    includeOutputs: ['**/main-*.js', '**/polyfill-*.js', '**/styles-*.css'],
  },
  scoring: {
    totalSize: 1_000_000,
    penalty: {
      artefactSize: [100, 100_000],
    },
  },
  insightsTable: {
    mode: 'all',
    groups: initialBundleSizeTableGroups,
    pruning: {
      maxChildren: 20,
    },
  },
  dependencyTree: {
    groups: initialBundleSizeTreeGroups,
    pruning: {
      maxChildren: 20,
      maxDepth: 2,
      minSize: 5_000,
    },
  },
};

const blacklistedFilesGroups: GroupingRule[] = [
  {
    title: 'Legacy/Deprecated',
    icon: '🕸️',
    include: [
      '**/node_modules/core-js/**',
      '**/node_modules/zone.js/**',
      '**/node_modules/smoothscroll-polyfill/**',
      '**/node_modules/web-animations-js/**',
      '**/node_modules/decimal.js/**',
      '**/node_modules/@storybook/**',
      '**/node_modules/jest/**',
    ],
  },
  {
    title: 'Blacklisted',
    icon: '🚫',
    include: ['**/node_modules/lodash/**'],
  },
];

const blacklistedFilesAudit: BundleStatsAuditOptions = {
  slug: 'blacklisted',
  title: '🚫 Blacklisted',
  description: `
Detects **blacklisted dependencies**, enforces **architectural standards**, prevents **security vulnerabilities**, and blocks **performance bottlenecks** from reaching production.`,
  selection: {
    mode: 'matchingOnly',
    includeInputs: [
      '**/node_modules/lodash/**',
      '**/node_modules/core-js/**',
      '**/node_modules/zone.js/**',
      '**/node_modules/smoothscroll-polyfill/**',
      '**/node_modules/web-animations-js/**',
      '**/node_modules/decimal.js/**',
      '**/node_modules/@storybook/**',
      '**/node_modules/jest/**',
    ],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: {
    mode: 'onlyMatching',
    groups: blacklistedFilesGroups,
    pruning: {
      enabled: true,
      maxChildren: 50,
      minSize: 1000,
    },
  },
  dependencyTree: {
    mode: 'onlyMatching',
    groups: blacklistedFilesGroups,
    pruning: {
      maxChildren: 30,
      maxDepth: 2,
    },
  },
};

const angularSpecificTableGroups: GroupingRule[] = [
  {
    include: [
      '**/node_modules/ngx-device-detector/**',
      '**/node_modules/angular2-toaster/**',
    ],
    icon: '🚨',
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/ngx-toastr/**',
      '**/node_modules/@angular-slider/**',
    ],
    icon: '🚫',
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/@ng-bootstrap/**',
      '**/node_modules/ng-circle-progress/**',
    ],
    icon: '🕸️',
    numSegments: 2,
  },
  {
    include: ['**/node_modules/ngx-float-ui/**'],
    icon: '⚠️',
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/@angular/core/**',
      '**/node_modules/@angular/common/**',
      '**/node_modules/@angular/platform-browser/**',
      '**/node_modules/@angular/platform-browser-dynamic/**',
      '**/node_modules/@angular/forms/**',
      '**/node_modules/@angular/router/**',
      '**/node_modules/@angular/animations/**',
    ],
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/@angular/material/**',
      '**/node_modules/@angular/cdk/**',
    ],
    numSegments: 2,
  },
  {
    include: ['**/node_modules/@ngrx/**', '**/node_modules/@rx-angular/**'],
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/ngx-daterangepicker-material/**',
      '**/node_modules/ngx-slider-v2/**',
      '**/node_modules/ngx-scrollbar/**',
    ],
    numSegments: 2,
  },
  {
    include: [
      '**/node_modules/@ngx-translate/**',
      '**/node_modules/ng-dynamic-component/**',
      '**/node_modules/ng-in-viewport/**',
      '**/node_modules/ng-lazyload-image/**',
      '**/node_modules/angularx-qrcode/**',
      '**/node_modules/ngx-lottie/**',
      '**/node_modules/ngx-popperjs/**',
      '**/node_modules/@ngu/**',
    ],
    numSegments: 2,
  },
  {
    title: 'Other Angular Packages',
    include: [
      '**/node_modules/ng-*/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/@ng*/**',
      '**/node_modules/*angular*/**',
    ],
  },
];

const angularSpecificTreeGroups: GroupingRule[] = angularSpecificTableGroups;

const angularSpecificAudit: BundleStatsAuditOptions = {
  slug: 'angular-ecosystem',
  title: '🅰️ Angular Ecosystem',
  description: `
**Security-first Angular analysis**: Identifies **security vulnerabilities**, **blacklisted packages**, **deprecated dependencies**, and **oversized components** to ensure a secure and optimized Angular application.`,
  selection: {
    mode: 'matchingOnly',
    includeInputs: [
      '**/node_modules/ngx-device-detector/**',
      '**/node_modules/angular2-toaster/**',
      '**/node_modules/ngx-toastr/**',
      '**/node_modules/@angular-slider/**',
      '**/node_modules/@ng-bootstrap/**',
      '**/node_modules/ng-circle-progress/**',
      '**/node_modules/ngx-float-ui/**',
      '**/node_modules/@angular/core/**',
      '**/node_modules/@angular/common/**',
      '**/node_modules/@angular/platform-browser/**',
      '**/node_modules/@angular/platform-browser-dynamic/**',
      '**/node_modules/@angular/forms/**',
      '**/node_modules/@angular/router/**',
      '**/node_modules/@angular/animations/**',
      '**/node_modules/@angular/material/**',
      '**/node_modules/@angular/cdk/**',
      '**/node_modules/@ngrx/**',
      '**/node_modules/@rx-angular/**',
      '**/node_modules/ngx-daterangepicker-material/**',
      '**/node_modules/ngx-slider-v2/**',
      '**/node_modules/ngx-scrollbar/**',
      '**/node_modules/@ngx-translate/**',
      '**/node_modules/ng-dynamic-component/**',
      '**/node_modules/ng-in-viewport/**',
      '**/node_modules/ng-lazyload-image/**',
      '**/node_modules/angularx-qrcode/**',
      '**/node_modules/ngx-lottie/**',
      '**/node_modules/ngx-popperjs/**',
      '**/node_modules/@ngu/**',
      '**/node_modules/ng-*/**',
      '**/node_modules/ngx-*/**',
      '**/node_modules/@ng*/**',
      '**/node_modules/*angular*/**',
      '**/node_modules/sports-animations/**',
    ],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: {
    mode: 'onlyMatching',
    groups: angularSpecificTableGroups,
    pruning: {
      enabled: true,
      maxChildren: 15,
      minSize: 5_000,
    },
  },
  dependencyTree: {
    mode: 'onlyMatching',
    groups: angularSpecificTreeGroups,
    pruning: {
      maxChildren: 10,
      maxDepth: 2,
      minSize: 10_000,
    },
  },
};

const dependencyAuditBlacklistedGroup: GroupingRule = {
  icon: '🚫',
  include: ['**/node_modules/lodash/**'],
  numSegments: 2,
};

const dependencyAuditLegacyGroup: GroupingRule = {
  icon: '🕸️',
  include: [
    '**/node_modules/core-js/**',
    '**/node_modules/zone.js/**',
    '**/node_modules/smoothscroll-polyfill/**',
    '**/node_modules/decimal.js/**',
  ],
  numSegments: 2,
};

const dependencyAuditAcceptedGroup: GroupingRule = {
  title: 'Accepted Dependencies',
  icon: '✅',
  include: [
    // Angular ecosystem packages
    '**/node_modules/@angular/**',
    '**/node_modules/@ng*/**',
    '**/node_modules/@ngx-*/**',
    '**/node_modules/ngx-*/**',
    '**/node_modules/ng-*/**',
    '**/node_modules/*angular*/**',
    // Specific Angular packages
    '**/node_modules/@angular-slider/**',
    '**/node_modules/ngx-slider-v2/**',
    '**/node_modules/ngx-scrollbar/**',
    // New accepted packages
    '**/node_modules/@module-federation/**',
    '**/node_modules/launchdarkly-js-client-sdk/**',
    '**/node_modules/socket.io-client/**',
    '**/node_modules/@microsoft/**',
    '**/node_modules/qrcode/**',
    '**/node_modules/dompurify/**',
    '**/node_modules/hammerjs/**',
    '**/node_modules/js-sha512/**',
    '**/node_modules/ua-parser-js/**',
    '**/node_modules/pixi-multistyle-text/**',
    '**/node_modules/howler/**',
    // Existing accepted packages
    '**/node_modules/react/**',
    '**/node_modules/react-dom/**',
    '**/node_modules/tslib/**',
    '**/node_modules/@incodetech/**',
    '**/node_modules/@emotion/**',
    '**/node_modules/scheduler/**',
    '**/node_modules/@jumio/**',
    '**/node_modules/moment-timezone/**',
    '**/node_modules/@pixi/**',
    '**/node_modules/gsap/**',
    '**/node_modules/qs/**',
    '**/node_modules/url/**',
    '**/node_modules/object-inspect/**',
    '**/node_modules/get-intrinsic/**',
    '**/node_modules/fontfaceobserver/**',
    '**/node_modules/earcut/**',
    '**/node_modules/pixi.js/**',
    '**/node_modules/sports-animations/**',
    '**/node_modules/konva/**',
    '**/node_modules/live-sports-visualization/**',
    '**/node_modules/@img-arena/**',
    '**/node_modules/@seontechnologies/**',
    '**/node_modules/jspdf/**',
    '**/node_modules/fflate/**',
    '**/node_modules/braintree-web/**',
    '**/node_modules/lodash-es/**',
    '**/node_modules/@floating-ui/**',
    '**/node_modules/ngx-toastr/**',
    '**/node_modules/ngx-float-ui/**',
    '**/node_modules/@rtms/**',
    '**/node_modules/@push-based/**',
    '**/node_modules/rxjs/**',
    '**/node_modules/bwin-tweenmax/**',
    '**/node_modules/swiper/**',
    '**/node_modules/bwin-winwheel/**',
    '**/node_modules/canvg/**',
    '**/node_modules/svg-pathdata/**',
    '**/node_modules/rgbcolor/**',
    '**/node_modules/stackblur-canvas/**',
    '**/node_modules/xml2js/**',
    '**/node_modules/buffer/**',
    '**/node_modules/sax/**',
    '**/node_modules/events/**',
    '**/node_modules/string_decoder/**',
    '**/node_modules/stream/**',
    '**/node_modules/primeng/**',
    '**/node_modules/moment/**',
    '**/node_modules/ngx-daterangepicker-material/**',
    '**/node_modules/jspdf-autotable/**',
    '**/node_modules/dayjs/**',
    '**/node_modules/dexie/**',
    '**/node_modules/ng-lazyload-image/**',
    '**/node_modules/@ngrx/**',
    '**/node_modules/@opentelemetry/**',
    '**/node_modules/html2canvas/**',
  ],
  numSegments: 1,
};

const dependencyAuditNewGroup: GroupingRule = {
  icon: '🆕',
  include: '**/node_modules/**',
  exclude: [
    ...dependencyAuditAcceptedGroup.include,
    ...dependencyAuditBlacklistedGroup.include,
    ...dependencyAuditLegacyGroup.include,
  ],
  numSegments: 2,
};

const dependencyAuditTableGroups: GroupingRule[] = [
  dependencyAuditBlacklistedGroup,
  dependencyAuditLegacyGroup,
  dependencyAuditAcceptedGroup,
  dependencyAuditNewGroup,
];

const dependencyAuditTreeGroups: GroupingRule[] = [
  dependencyAuditBlacklistedGroup,
  dependencyAuditLegacyGroup,
  dependencyAuditNewGroup,
];

const dependencyAudit: BundleStatsAuditOptions = {
  slug: 'node-modules',
  title: '📦 Dependency Tracking',
  description: `
Detects *newly added packages*, catches **forbidden dependencies**, monitors **3rd party costs**, and prevents **bundle bloat** from unreviewed dependencies.`,
  selection: {
    mode: 'matchingOnly',
    includeInputs: ['**/node_modules/**'],
  },
  insightsTable: {
    mode: 'onlyMatching',
    groups: dependencyAuditTableGroups,
    pruning: {
      maxChildren: 50,
      minSize: 2000,
    },
  },
  dependencyTree: {
    mode: 'onlyMatching',
    groups: [
      dependencyAuditBlacklistedGroup,
      dependencyAuditLegacyGroup,
      dependencyAuditNewGroup,
    ],
    pruning: {
      maxChildren: 50,
      maxDepth: 2,
      minSize: 2000,
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
        excludeOutputs: ['**/*.map', '**/*.d.ts'],
      },
      audits: [
        allFilesAudit,
        blacklistedFilesAudit,
        angularSpecificAudit,
        dependencyAudit,
        initialBundleSizeAudit,
      ],
    }),
  ],
};

export default config;
