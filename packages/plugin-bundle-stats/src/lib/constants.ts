import type { PruningConfig } from './runner/audits/details/tree.js';
import type { GroupingRule } from './runner/types.js';

/**
 * Default grouping rules for bundle stats analysis.
 * These rules help categorize and organize bundle assets by common patterns.
 */
export const DEFAULT_GROUPING: GroupingRule[] = [
  {
    title: '@angular/*',
    includeInputs: ['**/node_modules/@angular/**'],
    icon: '🅰️',
  },
  {
    title: 'react',
    includeInputs: ['**/node_modules/react/**', '**/node_modules/react-dom/**'],
    icon: '⚛️',
  },
  {
    title: 'preact',
    includeInputs: ['**/node_modules/preact/**', '**/node_modules/preact-*/**'],
    icon: '🪐',
  },
  {
    title: 'vue',
    includeInputs: ['**/node_modules/vue/**', '**/node_modules/@vue/**'],
    icon: '💚',
  },
  {
    title: 'solid',
    includeInputs: [
      '**/node_modules/solid-js/**',
      '**/node_modules/solid-*/**',
    ],
    icon: '🟢',
  },
  {
    title: 'lit',
    includeInputs: ['**/node_modules/lit/**', '**/node_modules/lit-html/**'],
    icon: '💡',
  },
  {
    title: 'svelte',
    includeInputs: [
      '**/node_modules/svelte/**',
      '**/node_modules/@sveltejs/**',
    ],
    icon: '🧡',
  },
  {
    title: 'ember',
    includeInputs: [
      '**/node_modules/ember-source/**',
      '**/node_modules/ember-cli/**',
    ],
    icon: '🔥',
  },
  {
    title: 'backbone',
    includeInputs: ['**/node_modules/backbone/**'],
    icon: '🦴',
  },
  {
    title: 'alpine',
    includeInputs: ['**/node_modules/alpinejs/**'],
    icon: '🏔️',
  },
  {
    title: 'next.js',
    includeInputs: ['**/node_modules/next/**'],
    icon: '▲',
  },
  {
    title: 'nuxt',
    includeInputs: ['**/node_modules/nuxt/**', '**/node_modules/@nuxt/**'],
    icon: '💚',
  },
  {
    title: 'sveltekit',
    includeInputs: ['**/node_modules/@sveltejs/kit/**'],
    icon: '🏗️',
  },
  {
    title: 'remix',
    includeInputs: [
      '**/node_modules/remix/**',
      '**/node_modules/@remix-run/**',
    ],
    icon: '🌀',
  },
  {
    title: 'gatsby',
    includeInputs: ['**/node_modules/gatsby/**'],
    icon: '🚀',
  },
  {
    title: 'eleventy',
    includeInputs: ['**/node_modules/eleventy/**', '**/node_modules/@11ty/**'],
    icon: '1️⃣1️⃣',
  },
  {
    title: 'astro',
    includeInputs: ['**/node_modules/astro/**'],
    icon: '🌌',
  },
  {
    title: '@mui/*',
    includeInputs: ['**/node_modules/@mui/**'],
    icon: '🖼️',
  },
  {
    title: 'antd',
    includeInputs: [
      '**/node_modules/antd/**',
      '**/node_modules/@ant-design/**',
    ],
    icon: '🐜',
  },
  {
    title: 'chakra-ui',
    includeInputs: ['**/node_modules/@chakra-ui/**'],
    icon: '🧘',
  },
  {
    title: 'tailwindcss',
    includeInputs: ['**/node_modules/tailwindcss/**'],
    icon: '🌬️',
  },
  {
    title: 'bootstrap',
    includeInputs: ['**/node_modules/bootstrap/**'],
    icon: '👢',
  },
  {
    title: 'bulma',
    includeInputs: ['**/node_modules/bulma/**'],
    icon: '🍹',
  },
  {
    title: 'redux',
    includeInputs: ['**/node_modules/redux/**', '**/node_modules/@reduxjs/**'],
    icon: '🛠️',
  },
  {
    title: 'mobx',
    includeInputs: ['**/node_modules/mobx/**'],
    icon: '🧪',
  },
  {
    title: 'zustand',
    includeInputs: ['**/node_modules/zustand/**'],
    icon: '🧊',
  },
  {
    title: 'recoil',
    includeInputs: ['**/node_modules/recoil/**'],
    icon: '🎱',
  },
  {
    title: 'rxjs',
    includeInputs: ['**/node_modules/rxjs/**'],
    icon: '🔄',
  },
  {
    title: 'xstate',
    includeInputs: ['**/node_modules/xstate/**'],
    icon: '⚙️',
  },
  {
    title: 'react-router',
    includeInputs: [
      '**/node_modules/react-router/**',
      '**/node_modules/react-router-dom/**',
    ],
    icon: '🗺️',
  },
  {
    title: 'vue-router',
    includeInputs: ['**/node_modules/vue-router/**'],
    icon: '🗺️',
  },
  {
    title: 'webpack',
    includeInputs: ['**/node_modules/webpack/**'],
    icon: '📦',
  },
  {
    title: 'rollup',
    includeInputs: ['**/node_modules/rollup/**'],
    icon: '🔄',
  },
  {
    title: 'vite',
    includeInputs: ['**/node_modules/vite/**'],
    icon: '⚡️',
  },
  {
    title: 'parcel',
    includeInputs: [
      '**/node_modules/parcel/**',
      '**/node_modules/parcel-bundler/**',
    ],
    icon: '🎁',
  },
  {
    title: 'esbuild',
    includeInputs: ['**/node_modules/esbuild/**'],
    icon: '🏗️',
  },
  {
    title: 'snowpack',
    includeInputs: ['**/node_modules/snowpack/**'],
    icon: '❄️',
  },
  {
    title: 'jest',
    includeInputs: ['**/node_modules/jest/**'],
    icon: '🎯',
  },
  {
    title: 'mocha',
    includeInputs: ['**/node_modules/mocha/**'],
    icon: '☕️',
  },
  {
    title: 'chai',
    includeInputs: ['**/node_modules/chai/**'],
    icon: '🍵',
  },
  {
    title: 'cypress',
    includeInputs: ['**/node_modules/cypress/**'],
    icon: '🌪️',
  },
  {
    title: 'playwright',
    includeInputs: ['**/node_modules/playwright/**'],
    icon: '🎭',
  },
  {
    title: 'ava',
    includeInputs: ['**/node_modules/ava/**'],
    icon: '🐦',
  },
  {
    title: 'express',
    includeInputs: ['**/node_modules/express/**'],
    icon: '🚆',
  },
  {
    title: 'koa',
    includeInputs: ['**/node_modules/koa/**'],
    icon: '🍵',
  },
  {
    title: 'hapi',
    includeInputs: ['**/node_modules/@hapi/hapi/**'],
    icon: '🎉',
  },
  {
    title: 'fastify',
    includeInputs: ['**/node_modules/fastify/**'],
    icon: '🚀',
  },
  {
    title: '@nestjs/*',
    includeInputs: ['**/node_modules/@nestjs/**'],
    icon: '🔱',
  },
  {
    title: 'sails',
    includeInputs: ['**/node_modules/sails/**'],
    icon: '⛵️',
  },
  {
    title: 'loopback',
    includeInputs: ['**/node_modules/@loopback/**'],
    icon: '🔄',
  },
  {
    title: 'feathers',
    includeInputs: ['**/node_modules/feathers/**'],
    icon: '🪶',
  },
  {
    title: 'meteor',
    includeInputs: ['**/node_modules/meteor/**'],
    icon: '☄️',
  },
  {
    title: 'typeorm',
    includeInputs: ['**/node_modules/typeorm/**'],
    icon: '🗄️',
  },
  {
    title: '@prisma/*',
    includeInputs: ['**/node_modules/@prisma/**'],
    icon: '📐',
  },
  {
    title: 'sequelize',
    includeInputs: ['**/node_modules/sequelize/**'],
    icon: '🐆',
  },
  {
    title: 'mongoose',
    includeInputs: ['**/node_modules/mongoose/**'],
    icon: '🐭',
  },
  {
    title: 'graphql',
    includeInputs: ['**/node_modules/graphql/**'],
    icon: '🔮',
  },
  {
    title: '@apollo/*',
    includeInputs: ['**/node_modules/@apollo/**'],
    icon: '🛰️',
  },
  {
    title: 'axios',
    includeInputs: ['**/node_modules/axios/**'],
    icon: '🎣',
  },
  {
    title: 'socket.io',
    includeInputs: ['**/node_modules/socket.io/**'],
    icon: '🔌',
  },
  {
    title: 'eslint',
    includeInputs: ['**/node_modules/eslint/**'],
    icon: '🧹',
  },
  {
    title: 'prettier',
    includeInputs: ['**/node_modules/prettier/**'],
    icon: '🖌️',
  },
  {
    title: 'husky',
    includeInputs: ['**/node_modules/husky/**'],
    icon: '🐶',
  },
  {
    title: 'lint-staged',
    includeInputs: ['**/node_modules/lint-staged/**'],
    icon: '🐝',
  },
  {
    title: 'storybook',
    includeInputs: ['**/node_modules/@storybook/**'],
    icon: '📖',
  },
  {
    title: 'packages/*',
    includeInputs: ['packages/**/*'],
    // folder icon
    icon: '📁',
  },
  {
    title: 'Dependencies',
    includeInputs: ['**/node_modules/@*/**', '**/node_modules/**'],
  },
];

/**
 * Default pruning options for bundle stats analysis.
 * These settings control how the bundle tree is simplified and organized.
 */
export const DEFAULT_PRUNING: PruningConfig = {
  maxChildren: 10,
  maxDepth: 4,
};

/**
 * Plugin slug for bundle stats plugin
 */
export const BUNDLE_STATS_PLUGIN_SLUG = 'bundle-stats';
