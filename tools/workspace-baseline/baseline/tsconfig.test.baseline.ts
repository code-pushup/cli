import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/json-updater.js';

export const tsconfigTestBase = createTsconfigBase('tsconfig.test.json', {
  extends: './tsconfig.json',
  compilerOptions: obj.add({
    outDir: '../../dist/out-tsc',
    types: ['vitest/globals', 'vitest/importMeta', 'vite/client', 'node'],
  }),
  include: arr.add([
    'vitest.unit.config.ts',
    'vitest.int.config.ts',
    'mocks/**/*.ts',
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/**/*.test.js',
    'src/**/*.test.jsx',
    'src/**/*.d.ts',
    '../../testing/test-setup/src/vitest.d.ts',
  ]),
});
