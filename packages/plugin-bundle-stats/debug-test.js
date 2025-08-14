import { unifyBundlerStats } from './src/lib/runner/unify/unify.esbuild.ts';

const esbuildStats = {
  inputs: {},
  outputs: {
    'dist/index.js': {
      imports: [
        {
          path: 'dist/chunks/chunk-WIJM4GGD.js',
          kind: 'import-statement',
        },
        {
          path: 'dist/chunks/feature-2-X2YVDBQK.js',
          kind: 'dynamic-import',
        },
      ],
      exports: ['default', 'indexOnlyFunction'],
      entryPoint: 'src/index.ts',
      inputs: {
        'src/index.ts': {
          bytesInOutput: 350,
        },
      },
      bytes: 496,
    },
  },
};

const result = unifyBundlerStats(esbuildStats);
console.log('ACTUAL RESULT:');
console.log(JSON.stringify(result, null, 2));

const expected = {
  'dist/index.js': {
    bytes: 496,
    entryPoint: 'src/index.ts',
    imports: [
      {
        path: 'dist/chunks/chunk-WIJM4GGD.js',
        kind: 'import-statement',
      },
      {
        path: 'dist/chunks/feature-2-X2YVDBQK.js',
        kind: 'dynamic-import',
      },
    ],
    exports: ['default', 'indexOnlyFunction'],
    inputs: {
      'src/index.ts': {
        bytesInOutput: 350,
      },
    },
  },
};

console.log('\nEXPECTED:');
console.log(JSON.stringify(expected, null, 2));
