import bundleStatsPlugin from './src';

// npx @code-pushup/cli collect --config packages/plugin-bundle-stats/code-pushup.config.ts
export default {
  plugins: [
    await bundleStatsPlugin({
      artefact:
        'packages/plugin-bundle-stats/mocks/fixtures/stats/esbuild.stats.json',
      bundler: 'esbuild',
      configs: [
        // Core application frameworks and libraries
        {
          name: 'Angular Framework',
          include: ['node_modules/@angular/**'],
        },
        {
          name: 'RxJS & Reactive Libraries',
          include: ['node_modules/rxjs/**', 'node_modules/@ngrx/**'],
        },
        {
          name: 'Third Party Utilities',
          include: [
            'node_modules/lodash-es/**',
            'node_modules/core-js/**',
            'node_modules/@ngx-translate/**',
          ],
        },

        // Business domain applications
        {
          name: 'Sports Betting App',
          include: [
            'packages/sports/web/app/**',
            'packages/sports/common/betslip/**',
          ],
        },
        {
          name: 'Sports Common Libraries',
          include: ['packages/sports/libs/common/**'],
        },
        {
          name: 'My Account Application',
          include: ['packages/myaccount/app/src/**'],
        },
        {
          name: 'Payments & Cashier',
          include: ['packages/payments/cashier-app/src/**'],
        },
        {
          name: 'Poker Platform',
          include: ['packages/poker/core-lib/**'],
        },
        {
          name: 'Casino Platform',
          include: ['packages/casino/**'],
        },
        {
          name: 'Promotions System',
          include: ['packages/promo/**'],
        },

        // Core platform libraries
        {
          name: 'Vanilla Core Library',
          include: ['packages/vanilla/lib/core/**'],
        },
        {
          name: 'Vanilla Features',
          include: ['packages/vanilla/lib/features/**'],
        },
        {
          name: 'Vanilla Shared Components',
          include: ['packages/vanilla/lib/shared/**'],
        },

        // Specific UI libraries and animations
        {
          name: 'UI Components & Animations',
          include: [
            'node_modules/sports-animations/**',
            'node_modules/@angular-slider/**',
          ],
        },

        // TypeScript and build utilities
        {
          name: 'Build & Runtime Utilities',
          include: ['node_modules/tslib/**', 'node_modules/subsink/**'],
        },
      ],
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      description: 'Bundle size analysis and performance metrics',
      refs: [
        // Core application frameworks and libraries
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'angular-framework',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'rxjs-reactive-libraries',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'third-party-utilities',
          weight: 1,
        },

        // Business domain applications
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'sports-betting-app',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'sports-common-libraries',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'my-account-application',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'payments-cashier',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'poker-platform',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'casino-platform',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'promotions-system',
          weight: 1,
        },

        // Core platform libraries
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'vanilla-core-library',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'vanilla-features',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'vanilla-shared-components',
          weight: 1,
        },

        // Specific UI libraries and animations
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'ui-components-animations',
          weight: 1,
        },

        // TypeScript and build utilities
        {
          type: 'audit',
          plugin: 'bundle-stats',
          slug: 'build-runtime-utilities',
          weight: 1,
        },
      ],
    },
  ],
};
