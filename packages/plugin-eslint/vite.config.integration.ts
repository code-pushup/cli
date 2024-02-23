/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/plugin-eslint',
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    alias: [
      {
        find: '@code-pushup/testing-utils',
        replacement: new URL('../../testing-utils/src', import.meta.url)
          .pathname,
      },
      {
        find: '@code-pushup/core',
        replacement: new URL('../core/src', import.meta.url).pathname,
      },
      {
        find: '@code-pushup/models',
        replacement: new URL('../models/src', import.meta.url).pathname,
      },
      {
        find: '@code-pushup/utils',
        replacement: new URL('../utils/src', import.meta.url).pathname,
      },
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    snapshotFormat: {
      escapeString: true,
    },
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing-utils/src/lib/setup/console.mock.ts',
      '../../testing-utils/src/lib/setup/reset.mocks.ts',
    ],
  },
});
