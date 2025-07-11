const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const compiler = webpack({
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        type: 'asset/source',
      },
      {
        test: /\.cjs$/,
        type: 'javascript/auto',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.cjs', '.css'],
    fallback: {
      // Ensure CommonJS modules are resolved properly
      fs: false,
      path: false,
    },
  },
  stats: {
    // Include more detailed information about modules and reasons
    modules: true,
    reasons: true,
    depth: true,
    usedExports: true,
    providedExports: true,
  },
});

compiler.run((err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  fs.writeFileSync('dist/stats.json', JSON.stringify(stats.toJson()));
  compiler.close(() => process.exit(0));
});
