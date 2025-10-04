import { defineConfig } from 'tsdown';

const projectName = process.env['NX_TASK_TARGET_PROJECT'];

export default defineConfig({
  entry: `packages/${projectName}/src/**/!(*.test|*.spec|*.unit.test|*.int.test|*.e2e.test|*.mock).ts`,
  tsconfig: `packages/${projectName}/tsconfig.lib.json`,
  outDir: `packages/${projectName}/dist/src`, // Output to src/ subdirectory to match tsc
  unbundle: true, // Preserve directory structure like tsc
  format: ['esm', 'cjs'], // dual build
  fixedExtension: true, // emit .mjs for esm and .cjs for cjs
  dts: true,
  hash: false,
  external: ['glob', 'zod', '@nx/devkit', 'eslint'],
  exports: false, // manually manage exports via onSuccess
  copy: [
    {
      from: `packages/${projectName}/README.md`,
      to: `packages/${projectName}/dist/README.md`,
    },
  ],
});
