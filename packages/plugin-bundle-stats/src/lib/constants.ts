import type {
  GroupingRule,
  PenaltyOptions,
  PruningOptions,
} from './runner/types.js';

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingRule[] = [
  {
    title: '@angular/*',
    patterns: ['**/node_modules/@angular/**'],
    icon: '🅰️',
  },
  {
    title: 'react',
    patterns: ['**/node_modules/react/**', '**/node_modules/react-dom/**'],
    icon: '⚛️',
  },
  {
    title: 'preact',
    patterns: [
      '**/node_modules/preact/**',
      '**/node_modules/preact-render-to-string/**',
    ],
    icon: '🪐',
  },
  {
    title: 'vue',
    patterns: ['**/node_modules/vue/**', '**/node_modules/@vue/**'],
    icon: '💚',
  },
  {
    title: 'solid',
    patterns: [
      '**/node_modules/solid-js/**',
      '**/node_modules/solid-app-router/**',
    ],
    icon: '🟢',
  },
  {
    title: 'lit',
    patterns: ['**/node_modules/lit/**', '**/node_modules/lit-html/**'],
    icon: '💡',
  },
  {
    title: 'svelte',
    patterns: ['**/node_modules/svelte/**', '**/node_modules/@sveltejs/**'],
    icon: '🧡',
  },
  {
    title: 'ember',
    patterns: [
      '**/node_modules/ember-source/**',
      '**/node_modules/ember-cli/**',
    ],
    icon: '🔥',
  },
  {
    title: 'backbone',
    patterns: ['**/node_modules/backbone/**'],
    icon: '🦴',
  },
  {
    title: 'alpine',
    patterns: ['**/node_modules/alpinejs/**'],
    icon: '🏔️',
  },
  {
    title: 'next.js',
    patterns: ['**/node_modules/next/**'],
    icon: '▲',
  },
  {
    title: 'nuxt',
    patterns: ['**/node_modules/nuxt/**', '**/node_modules/@nuxt/**'],
    icon: '💚',
  },
  {
    title: 'sveltekit',
    patterns: ['**/node_modules/@sveltejs/kit/**'],
    icon: '🏗️',
  },
  {
    title: 'remix',
    patterns: ['**/node_modules/remix/**', '**/node_modules/@remix-run/**'],
    icon: '🌀',
  },
  {
    title: 'gatsby',
    patterns: ['**/node_modules/gatsby/**'],
    icon: '🚀',
  },
  {
    title: 'eleventy',
    patterns: ['**/node_modules/eleventy/**', '**/node_modules/@11ty/**'],
    icon: '1️⃣1️⃣',
  },
  {
    title: 'astro',
    patterns: ['**/node_modules/astro/**'],
    icon: '🌌',
  },
  {
    title: '@mui/*',
    patterns: ['**/node_modules/@mui/**'],
    icon: '🖼️',
  },
  {
    title: 'antd',
    patterns: ['**/node_modules/antd/**', '**/node_modules/@ant-design/**'],
    icon: '🐜',
  },
  {
    title: 'chakra-ui',
    patterns: ['**/node_modules/@chakra-ui/**'],
    icon: '🧘',
  },
  {
    title: 'tailwindcss',
    patterns: ['**/node_modules/tailwindcss/**'],
    icon: '🌬️',
  },
  {
    title: 'bootstrap',
    patterns: ['**/node_modules/bootstrap/**'],
    icon: '👢',
  },
  {
    title: 'bulma',
    patterns: ['**/node_modules/bulma/**'],
    icon: '🍹',
  },
  {
    title: 'redux',
    patterns: ['**/node_modules/redux/**', '**/node_modules/@reduxjs/**'],
    icon: '🛠️',
  },
  {
    title: 'mobx',
    patterns: ['**/node_modules/mobx/**'],
    icon: '🧪',
  },
  {
    title: 'zustand',
    patterns: ['**/node_modules/zustand/**'],
    icon: '🧊',
  },
  {
    title: 'recoil',
    patterns: ['**/node_modules/recoil/**'],
    icon: '🎱',
  },
  {
    title: 'rxjs',
    patterns: ['**/node_modules/rxjs/**'],
    icon: '🔄',
  },
  {
    title: 'xstate',
    patterns: ['**/node_modules/xstate/**'],
    icon: '⚙️',
  },
  {
    title: 'react-router',
    patterns: [
      '**/node_modules/react-router/**',
      '**/node_modules/react-router-dom/**',
    ],
    icon: '🗺️',
  },
  {
    title: 'vue-router',
    patterns: ['**/node_modules/vue-router/**'],
    icon: '🗺️',
  },
  {
    title: 'webpack',
    patterns: ['**/node_modules/webpack/**'],
    icon: '📦',
  },
  {
    title: 'rollup',
    patterns: ['**/node_modules/rollup/**'],
    icon: '🔄',
  },
  {
    title: 'vite',
    patterns: ['**/node_modules/vite/**'],
    icon: '⚡️',
  },
  {
    title: 'parcel',
    patterns: [
      '**/node_modules/parcel/**',
      '**/node_modules/parcel-bundler/**',
    ],
    icon: '🎁',
  },
  {
    title: 'esbuild',
    patterns: ['**/node_modules/esbuild/**'],
    icon: '🏗️',
  },
  {
    title: 'snowpack',
    patterns: ['**/node_modules/snowpack/**'],
    icon: '❄️',
  },
  {
    title: 'jest',
    patterns: ['**/node_modules/jest/**'],
    icon: '🎯',
  },
  {
    title: 'mocha',
    patterns: ['**/node_modules/mocha/**'],
    icon: '☕️',
  },
  {
    title: 'chai',
    patterns: ['**/node_modules/chai/**'],
    icon: '🍵',
  },
  {
    title: 'cypress',
    patterns: ['**/node_modules/cypress/**'],
    icon: '🌪️',
  },
  {
    title: 'playwright',
    patterns: ['**/node_modules/playwright/**'],
    icon: '🎭',
  },
  {
    title: 'ava',
    patterns: ['**/node_modules/ava/**'],
    icon: '🐦',
  },
  {
    title: 'express',
    patterns: ['**/node_modules/express/**'],
    icon: '🚆',
  },
  {
    title: 'koa',
    patterns: ['**/node_modules/koa/**'],
    icon: '🍵',
  },
  {
    title: 'hapi',
    patterns: ['**/node_modules/@hapi/hapi/**'],
    icon: '🎉',
  },
  {
    title: 'fastify',
    patterns: ['**/node_modules/fastify/**'],
    icon: '🚀',
  },
  {
    title: '@nestjs/*',
    patterns: ['**/node_modules/@nestjs/**'],
    icon: '🔱',
  },
  {
    title: 'sails',
    patterns: ['**/node_modules/sails/**'],
    icon: '⛵️',
  },
  {
    title: 'loopback',
    patterns: ['**/node_modules/@loopback/**'],
    icon: '🔄',
  },
  {
    title: 'feathers',
    patterns: ['**/node_modules/feathers/**'],
    icon: '🪶',
  },
  {
    title: 'meteor',
    patterns: ['**/node_modules/meteor/**'],
    icon: '☄️',
  },
  {
    title: 'typeorm',
    patterns: ['**/node_modules/typeorm/**'],
    icon: '🗄️',
  },
  {
    title: '@prisma/*',
    patterns: ['**/node_modules/@prisma/**'],
    icon: '📐',
  },
  {
    title: 'sequelize',
    patterns: ['**/node_modules/sequelize/**'],
    icon: '🐆',
  },
  {
    title: 'mongoose',
    patterns: ['**/node_modules/mongoose/**'],
    icon: '🐭',
  },
  {
    title: 'graphql',
    patterns: ['**/node_modules/graphql/**'],
    icon: '🔮',
  },
  {
    title: '@apollo/*',
    patterns: ['**/node_modules/@apollo/**'],
    icon: '🛰️',
  },
  {
    title: 'axios',
    patterns: ['**/node_modules/axios/**'],
    icon: '🎣',
  },
  {
    title: 'socket.io',
    patterns: ['**/node_modules/socket.io/**'],
    icon: '🔌',
  },
  {
    title: 'eslint',
    patterns: ['**/node_modules/eslint/**'],
    icon: '🧹',
  },
  {
    title: 'prettier',
    patterns: ['**/node_modules/prettier/**'],
    icon: '🖌️',
  },
  {
    title: 'husky',
    patterns: ['**/node_modules/husky/**'],
    icon: '🐶',
  },
  {
    title: 'lint-staged',
    patterns: ['**/node_modules/lint-staged/**'],
    icon: '🐝',
  },
  {
    title: 'storybook',
    patterns: ['**/node_modules/@storybook/**'],
    icon: '📖',
  },
  {
    title: 'packages/*',
    patterns: ['packages/**/*'],
    // folder icon
    icon: '📁',
  },
  {
    title: '@*/*',
    patterns: ['**/node_modules/@*/**', '**/node_modules/**'],
  },
];

/**
 * Default pruning options for bundle stats analysis.
 * These settings control how the bundle tree is simplified and organized.
 */
export const DEFAULT_PRUNING: PruningOptions = {
  maxChildren: 10,
  startDepth: 0,
  maxDepth: 2,
};

export const DEFAULT_PENALTY: PenaltyOptions = {
  warningWeight: 1,
  errorWeight: 2,
};

/**
 * Plugin slug for bundle stats plugin
 */
export const BUNDLE_STATS_PLUGIN_SLUG = 'bundle-stats';
