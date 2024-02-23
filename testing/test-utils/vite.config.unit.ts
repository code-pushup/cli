/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../node_modules/.vite/test-utils',
  plugins: [nxViteTsPaths()],
  test: {
    globals: true,
    cache: {
      dir: '../node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
    globalSetup: ['../../global-setup.ts'],
    setupFiles: [
      'src/lib/setup/fs.mock.ts',
      'src/lib/setup/console.mock.ts',
      'src/lib/setup/reset.mocks.ts',
    ],
  },
});
