/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(dirname(import.meta.url)),
  build: {
    outDir: '../../dist/examples/react-todos-app',
    emptyOutDir: true,
    reportCompressedSize: true,
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
    reporters: ['basic'],
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    coverage: {
      reporter: ['lcov', 'text'],
      provider: 'v8',
      reportsDirectory: '../../coverage/react-todos-app',
      include: ['src/**/*.{js,jsx}'],
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['test-setup.js'],
  },
});
