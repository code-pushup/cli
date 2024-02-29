/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../node_modules/.vite/test-utils',
  plugins: [nxViteTsPaths()],
  test: {
    reporters: ['default'],
    globals: true,
    cache: {
      dir: '../node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.ts'],
  },
});
