import path from 'path';
import webpackStatsPlugin from 'rollup-plugin-webpack-stats';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: './dist/vite',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        bin: path.resolve(__dirname, 'src/bin.ts'),
      },
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'static/js/[name].js',
      },
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    webpackStatsPlugin({
      fileName: 'stats.json',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
