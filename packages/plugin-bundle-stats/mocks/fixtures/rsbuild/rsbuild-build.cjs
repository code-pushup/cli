const { createRsbuild } = require('@rsbuild/core');
const fs = require('fs');

async function build() {
  const rsbuild = await createRsbuild({
    rsbuildConfig: {
      source: { entry: { index: './src/index.js' } },
      output: {
        distPath: { root: 'dist' },
        filename: { js: 'bundle.js' },
      },
    },
  });

  const { stats } = await rsbuild.build();
  fs.writeFileSync('dist/stats.json', JSON.stringify(stats.toJson()));
  process.exit(0);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
