import { createTsconfigBase } from '../src/lib/baseline.tsconfig';
import { obj } from '../src/lib/json-updater.js';

export const tsconfigBase = createTsconfigBase('tsconfig.json', {
  // Don't enforce extends as it varies by project depth (../../tsconfig.base.json for packages, etc.)
  // Don't enforce include/files as root tsconfig.json files with references should have empty arrays
  compilerOptions: obj.add({
    module: 'ESNext',
    forceConsistentCasingInFileNames: true,
    strict: true,
    noImplicitOverride: true,
    noPropertyAccessFromIndexSignature: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    types: ['vitest'],
  }),
});
