import { defineConfig } from 'tsdown';

// Project name is examples-plugins but directory is examples/plugins
const projectDir = 'examples/plugins';

export default defineConfig({
  entry: `${projectDir}/src/**/!(*.test|*.spec|*.unit.test|*.int.test|*.e2e.test|*.mock).ts`,
  tsconfig: `${projectDir}/tsconfig.lib.json`,
  outDir: `${projectDir}/dist/src`, // Output to src/ subdirectory to match tsc
  unbundle: true, // Preserve directory structure like tsc
  format: ['esm', 'cjs'], // dual build
  fixedExtension: true, // emit .mjs for esm and .cjs for cjs
  dts: true,
  hash: false,
  external: [],
  exports: false, // manually manage exports via onSuccess
});
