import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { arr, obj } from '../src/lib/json-updater.js';

export const tsconfigLibBase = createTsconfigBase(
  ['tsconfig.lib.json', 'tsconfig.json'],
  {
    extends: './tsconfig.base.json',
    compilerOptions: obj.add({
      strict: true,
      noEmit: true,
    }),
    include: arr.add(['src/**/*.ts', 'tests/**/*.ts']),
    exclude: arr.add(['node_modules', 'dist']),
  },
);
