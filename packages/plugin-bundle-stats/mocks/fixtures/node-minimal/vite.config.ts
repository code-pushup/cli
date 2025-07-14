import path from 'path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Custom Vite plugin to generate bundle stats in a format compatible with other bundlers.
 */
function bundleStatsPlugin(): Plugin {
  return {
    name: 'bundle-stats',
    generateBundle(_options: any, bundle: any) {
      const stats = {
        assets: [] as any[],
        chunks: [] as any[],
        modules: [] as any[],
        entrypoints: {} as Record<string, any>,
      };

      // Process bundle to create stats structure
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk &&
          typeof chunk === 'object' &&
          'type' in chunk &&
          chunk.type === 'chunk'
        ) {
          const chunkCode =
            'code' in chunk && typeof chunk.code === 'string' ? chunk.code : '';
          const chunkName =
            'name' in chunk && typeof chunk.name === 'string'
              ? chunk.name
              : fileName;
          const isEntry = 'isEntry' in chunk ? Boolean(chunk.isEntry) : false;
          const modules =
            'modules' in chunk && typeof chunk.modules === 'object'
              ? chunk.modules
              : {};

          // Add asset info
          stats.assets.push({
            name: fileName,
            size: Buffer.byteLength(chunkCode, 'utf8'),
            emitted: true,
            type: 'chunk',
          });

          // Add chunk info
          stats.chunks.push({
            id: chunkName,
            names: chunkName !== fileName ? [chunkName] : [],
            files: [fileName],
            size: Buffer.byteLength(chunkCode, 'utf8'),
            modules: Object.keys(modules || {}).map(moduleId => ({
              identifier: moduleId,
              name: moduleId,
              size: 0, // Vite doesn't provide individual module sizes
              chunks: [chunkName],
            })),
            entry: isEntry,
            initial: isEntry,
          });

          // Add entrypoint info if it's an entry chunk
          if (isEntry && chunkName) {
            stats.entrypoints[chunkName] = {
              name: chunkName,
              chunks: [chunkName],
              assets: [
                {
                  name: fileName,
                  size: Buffer.byteLength(chunkCode, 'utf8'),
                },
              ],
            };
          }
        }
      }

      // Emit the stats.json file
      this.emitFile({
        type: 'asset',
        fileName: 'stats.json',
        source: JSON.stringify(stats, null, 2),
      });
    },
  };
}

export default defineConfig({
  build: {
    outDir: './dist/vite',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        bin: path.resolve(__dirname, 'src/bin.ts'),
      },
      output: {
        entryFileNames: 'static/js/[name].js',
        chunkFileNames: 'static/js/async/[name].[hash].js',
        assetFileNames: 'static/[ext]/[name].[ext]',
      },
      plugins: [bundleStatsPlugin()],
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
