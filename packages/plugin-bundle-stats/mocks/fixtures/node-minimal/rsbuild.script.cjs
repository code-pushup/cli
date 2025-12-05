const { createRsbuild, loadConfig } = require('@rsbuild/core');
const fs = require('fs');
const path = require('path');

async function build() {
  try {
    // Load the config from rsbuild.config.ts
    const { content } = await loadConfig();

    const rsbuild = await createRsbuild({
      rsbuildConfig: content,
    });

    const { stats } = await rsbuild.build();

    // Ensure output directory exists
    const outputDir = 'dist/rsbuild';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write stats.json
    fs.writeFileSync(
      path.join(outputDir, 'stats.json'),
      JSON.stringify(stats.toJson(), null, 2),
    );
    console.log(`Stats written to ${outputDir}/stats.json`);

    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
