import { defineConfig } from 'tsdown';

const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export default defineConfig({
  entry: `tools/${projectName}/src/**/!(*.test|*.spec|*.unit.test|*.int.test|*.e2e.test|*.mock).ts`,
  tsconfig: `tools/${projectName}/tsconfig.lib.json`,
  outDir: `tools/${projectName}/dist/src`, // Output to src/ subdirectory to match tsc
  unbundle: true, // Preserve directory structure like tsc
  format: ['esm', 'cjs'], // dual build
  fixedExtension: true, // emit .mjs for esm and .cjs for cjs
  dts: true,
  hash: false,
  external: ['ansis', 'tslib', 'eslint'],
  exports: false, // manually manage exports via onSuccess
  copy: [
    {
      from: `tools/${projectName}/README.md`,
      to: `tools/${projectName}/dist/README.md`,
    },
  ],
});
