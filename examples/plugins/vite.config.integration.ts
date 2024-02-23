/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/cli',
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    alias: [
      {
        find: '@code-pushup/test-utils',
        replacement: new URL('../../testing/test-utils/src', import.meta.url)
          .pathname,
      },
      {
        find: '@code-pushup/core',
        replacement: new URL('../../packages/core/src', import.meta.url)
          .pathname,
      },
      {
        find: '@code-pushup/models',
        replacement: new URL('../../packages/models/src', import.meta.url)
          .pathname,
      },
      {
        find: '@code-pushup/utils',
        replacement: new URL('../../packages/utils/src', import.meta.url)
          .pathname,
      },
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.integration.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/git.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  },
});
