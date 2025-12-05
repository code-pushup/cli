const { build } = require('esbuild');
const sonda = require('sonda/esbuild').default;
const fs = require('fs');
const path = require('path');

const config = {
  entryPoints: ['src/index.ts', 'src/bin.ts'],
  bundle: true,
  outdir: 'dist/esbuild-sonda',
  entryNames: '[name]',
  chunkNames: 'chunks/[name]',
  metafile: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  minify: false,
  splitting: true,
  external: [],
  treeShaking: true,
  loader: {
    '.css': 'css',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
  },
  logLevel: 'info',
  plugins: [
    sonda({
      filename: 'sonda-report.json',
      format: 'json',
      open: false,
    }),
  ],
};

async function buildWithStats() {
  try {
    const result = await build(config);

    // Write metafile to stats.json (for compatibility)
    if (result.metafile) {
      const statsPath = path.join(config.outdir, 'stats.json');
      fs.writeFileSync(statsPath, JSON.stringify(result.metafile, null, 2));
      console.log(`Stats written to ${statsPath}`);
    }

    console.log('Build completed successfully with Sonda plugin!');
    console.log('Sonda report: .sonda/sonda-report.json');
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
