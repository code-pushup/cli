import type { Config } from 'zod2md';

export default {
  entry: 'packages/models/src/index.ts',
  tsconfig: 'packages/models/tsconfig.lib.json',
  format: 'esm',
  title: 'Code PushUp models reference',
  output: 'packages/models/docs/models-reference.md',
} satisfies Config;
