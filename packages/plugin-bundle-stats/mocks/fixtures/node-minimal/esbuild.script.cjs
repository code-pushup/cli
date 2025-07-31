const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

const config = {
  entryPoints: ['src/index.ts', 'src/bin.ts'],
  bundle: true,
  outdir: 'dist/esbuild',
  entryNames: '[name]', // This ensures entry points keep their original names
  chunkNames: 'chunks/[name]', // Put shared chunks in a subfolder without hash
  metafile: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  minify: false,
  splitting: true, // Keep splitting but with better chunk strategy
  external: [], // Bundle all dependencies
  treeShaking: true, // Enable tree shaking to ensure unique content per entry
  loader: {
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
  },
  logLevel: 'info',
};

async function buildWithStats() {
  try {
    const result = await build(config);

    // Write metafile to stats.json
    if (result.metafile) {
      const statsPath = path.join(config.outdir, 'stats.json');
      fs.writeFileSync(statsPath, JSON.stringify(result.metafile, null, 2));
      console.log(`Stats written to ${statsPath}`);
    }

    console.log('Build completed successfully!');
    return result;
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// If this file is run directly, execute the build
if (require.main === module) {
  buildWithStats();
}

module.exports = { config, buildWithStats };
