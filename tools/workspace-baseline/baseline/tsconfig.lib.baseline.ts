import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/json-updater.js';

export const tsconfigLibBase = createTsconfigBase('tsconfig.lib.json', {
  extends: './tsconfig.json',
  compilerOptions: obj.add({
    outDir: '../../dist/out-tsc',
    declaration: true,
    types: ['node'],
  }),
  include: arr.add(['src/**/*.ts']),
  exclude: arr.add([
    'vitest.unit.config.ts',
    'vitest.int.config.ts',
    'src/**/*.test.ts',
    'src/**/*.mock.ts',
    'mocks/**/*.ts',
  ]),
});
