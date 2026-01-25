import type { Config } from 'zod2md';

// see: https://github.com/matejchalk/zod2md?tab=readme-ov-file#configuration-file-reference
export default {
  entry: 'libs/test-app/src/index.ts',
  format: 'esm',
  title: 'test-app reference',
  output: 'libs/test-app/docs/test-app-reference.md',
  tsconfig: 'libs/test-app/tsconfig.lib.json',
} satisfies CoreConfig;
