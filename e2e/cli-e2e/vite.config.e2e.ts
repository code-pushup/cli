/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/cli-e2e',
  plugins: [nxViteTsPaths()],
  test: {
    testTimeout: 120_000,
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    alias: [
      {
        find: '@code-pushup/models',
        replacement: new URL('../../packages/models/src', import.meta.url)
          .pathname,
      },
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    environment: 'node',
    include: ['tests/**/*.e2e.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.e2e.ts'],
    setupFiles: ['../../testing/test-setup/src/lib/reset.mocks.ts'],
  },
});
