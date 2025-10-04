import { defineConfig } from 'tsdown';

const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export default defineConfig({
  entry: `testing/${projectName}/src/**/!(*.test|*.spec|*.unit.test|*.int.test|*.e2e.test|*.mock).ts`,
  tsconfig: `testing/${projectName}/tsconfig.lib.json`,
  outDir: `testing/${projectName}/dist/src`, // Output to src/ subdirectory to match tsc
  unbundle: true, // Preserve directory structure like tsc
  format: ['esm', 'cjs'], // dual build
  fixedExtension: true, // emit .mjs for esm and .cjs for cjs
  dts: true,
  hash: false,
  external: [],
  exports: false, // manually manage exports via onSuccess
  // README exists but this is a testing utility, copy not needed for publication
});
