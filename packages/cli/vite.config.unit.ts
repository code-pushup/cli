/// <reference types="vitest" />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/cli',
  plugins: [nxViteTsPaths()],
  test: {
    reporters: ['default'],
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov'],
    },
    environment: 'node',
    include: ['src/**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    globalSetup: ['global-setup.ts'],
    setupFiles: [
      '../../testing/test-setup/src/lib/fs.mock.ts',
      '../../testing/test-setup/src/lib/git.mock.ts',
      '../../testing/test-setup/src/lib/console.mock.ts',
      '../../testing/test-setup/src/lib/portal-client.mock.ts',
      '../../testing/test-setup/src/lib/reset.mocks.ts',
    ],
  },
});
