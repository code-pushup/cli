import bundleStatsPlugin from './src/index.js';
import { GroupingRule } from './src/lib/runner/types.js';
import { BundleStatsAuditOptions } from './src/lib/types.js';

type PatternList = string[];

const allFilesGroups: GroupingRule[] = [
  {
    title: 'Internal Packages',
    includeInputs: ['**/packages/**'],
    icon: '🟣',
    numSegments: 1,
  },
  {
    title: 'External Dependencies',
    includeInputs: ['**/node_modules/**'],
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
    excludeOutputs: ['**/*.map', '**/*.d.ts'],
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
    includeInputs: [
      '**/node_modules/lodash/**',
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
    includeInputs: [
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
    includeInputs: [
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
    includeInputs: [
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
    includeInputs: [
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
    includeInputs: [
      '**/packages/design-system/**',
      '**/packages/utils/**',
      '**/packages/shared/**',
      '**/packages/common/**',
    ],
  },
  {
    title: 'Node modules',
    includeInputs: ['**/node_modules/**'],
    icon: '📦',
  },
];

const initialBundleSizeTreeGroups: GroupingRule[] = [
  {
    includeInputs: ['**/node_modules/*angular*/**'],
    icon: '🅰️',
    numSegments: 2,
  },
  {
    title: 'Design System',
    includeInputs: ['**/packages/design-system/**'],
    icon: '🟣',
  },
  {
    title: 'Deprecated Theme',
    includeInputs: ['**/packages/themepark/**'],
    icon: '🚫',
  },
  {
    includeInputs: ['**/packages/**'],
    icon: '🟣',
    numSegments: 2,
  },
  {
    title: 'Payments',
    includeInputs: ['**/packages/payments/**'],
    icon: '💳',
  },
  {
    title: 'Casino',
    includeInputs: ['**/packages/casino/**'],
    icon: '🎰',
  },
  {
    title: 'Bingo',
    includeInputs: ['**/packages/bingo/**'],
    icon: '🎯',
  },
  {
    title: 'Sports',
    includeInputs: ['**/packages/sports/**'],
    icon: '⚽',
  },
  {
    title: 'Poker',
    includeInputs: ['**/packages/poker/**'],
    icon: '🃏',
  },
  {
    title: 'Lottery',
    includeInputs: ['**/packages/lottery/**'],
    icon: '🎲',
  },
  {
    title: 'Horse Racing',
    includeInputs: ['**/packages/horseracing/**'],
    icon: '🐎',
  },
  {
    title: 'Oxygen',
    includeInputs: ['**/packages/oxygen/**'],
    icon: '🫧',
  },
  {
    title: 'My Account',
    includeInputs: ['**/packages/myaccount/**'],
    icon: '👤',
  },
  {
    title: 'Promotions',
    includeInputs: ['**/packages/promo/**'],
    icon: '🎁',
  },
  {
    title: 'Moka Bingo',
    includeInputs: ['**/packages/mokabingo/**'],
    icon: '🎯',
  },
  {
    title: 'React',
    includeInputs: ['**/node_modules/react/**'],
    icon: '⚛️',
  },
  {
    title: 'Lodash ES',
    includeInputs: ['**/node_modules/lodash-es/**'],
    icon: '🔧',
  },
  {
    title: 'Node Modules',
    includeInputs: ['**/node_modules/**'],
    numSegments: 2,
  },
];

const initialBundleSizeAudit: BundleStatsAuditOptions = {
  slug: 'initial-bundle-size',
  title: '🔥 Initial Bundle Size',
  description: `
Monitors **critical loading performance**, enforces **size budgets**, detects **bloat sources**, and prevents **slow startup times** in main application bundles.`,
  selection: {
    mode: 'withStartupDeps',
    includeOutputs: ['**/main*.js', '**/polyfill*.js', '**/styles*.css'],
    excludeOutputs: ['**/*.map', '**/*.d.ts'],
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
  },
  dependencyTree: {
    groups: initialBundleSizeTreeGroups,
  },
};

const blacklist = [
  // IMMEDIATE PRIORITY - Dead dependency, can be removed immediately
  {
    pattern: '**/node_modules/angular2-toaster/**',
    hint: '`angular2-toaster` is deprecated and unused. Please remove from package.json - already replaced by `ds-toast`.',
  },

  // HIGH PRIORITY - Full DS alternative available
  {
    pattern: '**/node_modules/ngx-float-ui/**',
    hint: '`ngx-float-ui` is being replaced by `ds-tooltip` for consistency and reduced dependencies. The DS tooltip supports 4 positions and 3 arrow positions with advanced overlay integration.',
  },

  // MEDIUM PRIORITY - DS alternatives available but need extensions
  {
    pattern: '**/node_modules/@angular-slider/ngx-slider/**',
    hint: '`@angular-slider/ngx-slider` adds significant bundle size. `ds-range-selector` is available but needs custom case extensions from HoneyBadgers team. For new code only: use `ds-range-selector`.',
  },

  {
    pattern: '**/node_modules/ngx-slider-v2/**',
    hint: '`ngx-slider-v2` bundle impact unknown and appears less maintained than @angular-slider/ngx-slider. `ds-range-selector` available but needs custom case extensions. For new code only: use `ds-range-selector`.',
  },

  {
    pattern: '**/node_modules/ngx-toastr/**',
    hint: '`ngx-toastr` adds significant bundle size. Consider `ds-toast` for new components. Service pattern migration pending - missing show/hide programmatic API. Contact HoneyBadgers team for service API.',
  },

  // LOW PRIORITY - Strategic migration candidates
  {
    pattern: '**/node_modules/@angular/material/dialog/**',
    hint: 'Consider `ds-modal` or `ds-dialog` for new components. Existing usage can remain until strategic migration phase due to complexity.',
  },

  {
    pattern: '**/node_modules/@angular/material/slider/**',
    hint: '`ds-range-selector` available but needs validation for Material slider compatibility and feature coverage. For new code only: use `ds-range-selector`.',
  },

  {
    pattern: '**/node_modules/@angular/material/bottom-sheet/**',
    hint: 'Consider `ds-modal` with bottom positioning for new components. Existing bottom-sheet usage can remain until strategic migration.',
  },
];

const blacklistedFilesGroups: GroupingRule[] = [
  {
    title: 'Legacy/Deprecated',
    icon: '🕸️',
    includeInputs: [
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
    includeInputs: [
      '**/node_modules/lodash/**',
      // New blacklisted dependencies with DS alternatives
      '**/node_modules/angular2-toaster/**',
      '**/node_modules/ngx-float-ui/**',
      '**/node_modules/@angular-slider/ngx-slider/**',
      '**/node_modules/ngx-slider-v2/**',
      '**/node_modules/ngx-toastr/**',
      '**/node_modules/@angular/material/dialog/**',
      '**/node_modules/@angular/material/slider/**',
      '**/node_modules/@angular/material/bottom-sheet/**',
    ],
  },
];

const angularSpecificTableGroups: GroupingRule[] = [
  {
    includeInputs: [
      '**/node_modules/ngx-device-detector/**',
      '**/node_modules/angular2-toaster/**',
    ],
    icon: '🚨',
    numSegments: 2,
  },
  {
    includeInputs: [
      '**/node_modules/ngx-toastr/**',
      '**/node_modules/@angular-slider/**',
    ],
    icon: '🚫',
    numSegments: 2,
  },
  {
    includeInputs: [
      '**/node_modules/@ng-bootstrap/**',
      '**/node_modules/ng-circle-progress/**',
    ],
    icon: '🕸️',
    numSegments: 2,
  },
  {
    includeInputs: ['**/node_modules/ngx-float-ui/**'],
    icon: '⚠️',
    numSegments: 2,
  },
  {
    includeInputs: [
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
    includeInputs: [
      '**/node_modules/@angular/material/**',
      '**/node_modules/@angular/cdk/**',
    ],
    numSegments: 2,
  },
  {
    includeInputs: [
      '**/node_modules/@ngrx/**',
      '**/node_modules/@rx-angular/**',
    ],
    numSegments: 2,
  },
  {
    includeInputs: [
      '**/node_modules/ngx-daterangepicker-material/**',
      '**/node_modules/ngx-slider-v2/**',
      '**/node_modules/ngx-scrollbar/**',
    ],
    numSegments: 2,
  },
  {
    includeInputs: [
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
    includeInputs: [
      '**/node_modules/angular*/**',
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
      '**/node_modules/angularx-qrcode/**',
      '**/node_modules/ngx-lottie/**',
      '**/node_modules/ngx-popperjs/**',
      '**/node_modules/sports-animations/**',
    ],
    excludeInputs: ['**/*.map', '**/*.d.ts'],
  },
  insightsTable: {
    mode: 'onlyMatching',
    groups: angularSpecificTableGroups,
  },
  dependencyTree: {
    mode: 'onlyMatching',
    groups: angularSpecificTreeGroups,
  },
};

const dependencyAuditBlacklistedGroup: GroupingRule = {
  icon: '🚫',
  includeInputs: [
    '**/node_modules/react/**',
    '**/node_modules/react-dom/**',
    '**/node_modules/lodash/**',
    '**/node_modules/underscore/**',
    '**/node_modules/@babel/**',
    '**/node_modules/moment/**',
    '**/node_modules/ng-lazyload-image/**',
    '**/node_modules/angular2-toaster/**',
    '**/node_modules/ngx-float-ui/**',
    '**/node_modules/@angular-slider/ngx-slider/**',
    '**/node_modules/ngx-slider-v2/**',
    '**/node_modules/ngx-toastr/**',
    '**/node_modules/@angular/material/dialog/**',
    '**/node_modules/@angular/material/slider/**',
    '**/node_modules/@angular/material/bottom-sheet/**',
  ],
  numSegments: 2,
};

const dependencyAuditLegacyGroup: GroupingRule = {
  icon: '🕸️',
  includeInputs: [
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
  includeInputs: [
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
    '**/node_modules/ngx-daterangepicker-material/**',
    '**/node_modules/jspdf-autotable/**',
    '**/node_modules/dayjs/**',
    '**/node_modules/dexie/**',
    '**/node_modules/ng-lazyload-image/**',
    '**/node_modules/@opentelemetry/**',
    '**/node_modules/html2canvas/**',
    '**/node_modules/fastdom/**',
    '**/node_modules/base64-js/**',
    '**/node_modules/component-emitter/**',
    '**/node_modules/dijkstrajs/**',
    '**/node_modules/parseuri/**',
    '**/node_modules/has-symbols/**',
    '**/node_modules/function-bind/**',
    '**/node_modules/object-assign/**',
    '**/node_modules/raf/**',
    '**/node_modules/blob/**',
    '**/node_modules/ieee754/**',
    '**/node_modules/has-binary2/**',
    '**/node_modules/side-channel-weakmap/**',
    '**/node_modules/js-levenshtein/**',
    '**/node_modules/safe-buffer/**',
    '**/node_modules/detect-it/**',
    '**/node_modules/side-channel-list/**',
    '**/node_modules/timers/**',
    '**/node_modules/backo2/**',
    '**/node_modules/side-channel-map/**',
    '**/node_modules/encode-utf8/**',
    '**/node_modules/math-intrinsics/**',
    '**/node_modules/call-bind-apply-helpers/**',
    '**/node_modules/performance-now/**',
    '**/node_modules/custom-event-js/**',
    '**/node_modules/subsink/**',
    '**/node_modules/safe-buffer/**',
    '**/node_modules/detect-it/**',
    '**/node_modules/side-channel-list/**',
    '**/node_modules/timers/**',
    '**/node_modules/backo2/**',
    '**/node_modules/side-channel-map/**',
    '**/node_modules/encode-utf8/**',
    '**/node_modules/math-intrinsics/**',
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
    '**/node_modules/socket.io-client/**',
    '**/node_modules/indexof/**',
    '**/node_modules/hasown/**',
    '**/node_modules/component-inherit/**',
    '**/node_modules/es-define-property/**',
    '**/node_modules/has-cors/**',
    '**/node_modules/to-array/**',
    '**/node_modules/es-object-atoms/**',
    '**/node_modules/xhr2/**',
    '**/node_modules/fast-json-patch/**',
    '**/node_modules/canvas-confetti/**',
    '**/node_modules/cssfilter/**',
    '**/node_modules/xss/**',
    '**/node_modules/cds-client/**',
    '**/node_modules/immer/**',
    '**/node_modules/resize-observer-polyfill/**',
    '**/node_modules/fontfaceobserver-es/**',
    '**/node_modules/@cloudflare/**',
    '**/node_modules/css-element-queries/**',
    '**/node_modules/blueimp-md5/**',
    '**/node_modules/isomorphic-rslog/**',
    '**/node_modules/@swimlane/**',
    '**/node_modules/lottie-web/**',
    '**/node_modules/ngx-scrollbar/**',
    '**/node_modules/ngx-device-detector/**',
    '**/node_modules/@ngrx/**',
    '**/node_modules/@ng-bootstrap/**',
    '**/node_modules/@rx-angular/**',
    '**/node_modules/@ngu/**',
    '**/node_modules/@angular/**',
    '**/node_modules/ng-circle-progress/**',
    '**/node_modules/ngx-popperjs/**',
    '**/node_modules/ng-dynamic-component/**',
    '**/node_modules/ng-in-viewport/**',
    '**/node_modules/angularx-qrcode/**',
    '**/node_modules/ngx-lottie/**',
    '**/node_modules/socket.io-client/**',
  ],
  numSegments: 1,
};

const dependencyAuditNewGroup: GroupingRule = {
  icon: '🆕',
  includeInputs: '**/node_modules/**',
  excludeInputs: [
    ...dependencyAuditAcceptedGroup.includeInputs,
    ...dependencyAuditBlacklistedGroup.includeInputs,
    ...dependencyAuditLegacyGroup.includeInputs,
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
      //  minSize: 2000,
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
      maxChildren: 150,
    },
  },
};

const config = {
  plugins: [
    await bundleStatsPlugin({
      bundler: 'esbuild',
      artifactsPaths:
        './packages/plugin-bundle-stats/mocks/fixtures/stats/angular-large.stats.json',
      audits: [
        allFilesAudit,
        angularSpecificAudit,
        dependencyAudit,
        initialBundleSizeAudit,
      ],
    }),
  ],
};

export default config;
