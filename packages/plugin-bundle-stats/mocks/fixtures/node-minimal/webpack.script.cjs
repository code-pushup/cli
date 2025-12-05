const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const config = require('./webpack.config.js');

const compiler = webpack(config);

compiler.run((err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = 'dist/webpack';
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
  compiler.close(() => process.exit(0));
});
