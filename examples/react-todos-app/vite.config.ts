/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: '../../dist/examples/react-todos-app',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  cacheDir: '../../node_modules/.vite/react-todos-app',

  server: {
    port: 3000,
    host: 'localhost',
  },

  preview: {
    port: 3100,
    host: 'localhost',
  },

  plugins: [react()],

  test: {
    reporters: ['default'],
    reportsDirectory: '../../coverage/examples/react-todos-app',
    provider: 'v8',
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov', 'text'],
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['test-setup.js'],
  },
});
