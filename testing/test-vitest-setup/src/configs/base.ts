/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { tsconfigPathAliases } from '../utils/tsconfig-path-aliases.js';

export const baseTestConfig = defineConfig({
  test: {
    reporters: ['basic'],
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    alias: tsconfigPathAliases(),
    pool: 'threads',
    poolOptions: { threads: { singleThread: true } },
    environment: 'node',
    globalSetup: ['../../global-setup.ts'],
    setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
  },
});
