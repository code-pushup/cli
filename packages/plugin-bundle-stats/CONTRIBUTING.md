# Contributing

## Development

### Generate Build Artifacts

Before running the plugin, you need to generate the bundle stats files from the test fixtures. Each bundler produces different output formats:

```bash
# Navigate to the test fixture
cd packages/plugin-bundle-stats/mocks/fixtures/node-minimal

# Generate artifacts for all bundlers
npm run build

# Or generate artifacts for specific bundlers
npm run build:esbuild    # → dist/esbuild/stats.json
npm run build:webpack    # → dist/webpack/stats.json
npm run build:rsbuild    # → dist/rsbuild/stats.json
npm run build:vite       # → dist/vite/stats.json
```

### Running the Plugin

Once the artifacts are generated, you can run the Code PushUp plugin to analyze them:

```bash
# Run plugin analysis for each bundler
nx run plugin-bundle-stats:code-pushup-minimal-esbuild
nx run plugin-bundle-stats:code-pushup-minimal-webpack
nx run plugin-bundle-stats:code-pushup-minimal-rsbuild
nx run plugin-bundle-stats:code-pushup-minimal-vite
```
