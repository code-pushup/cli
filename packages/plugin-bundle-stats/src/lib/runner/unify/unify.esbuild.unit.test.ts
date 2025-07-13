import { describe, expect, it } from 'vitest';
import { unifyBundlerStats } from './unify.esbuild.js';
import type { EsBuildCoreStats } from './unify.esbuild.js';

describe('unifyBundlerStats', () => {
  it('should only consider outputs and provide default values', () => {
    const esbuildStats: EsBuildCoreStats = {
      inputs: {},
      outputs: {
        'dist/index.js': {
          bytes: 100,
        },
      },
    };
    expect(unifyBundlerStats(esbuildStats)).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 100,
        imports: [],
        inputs: {},
      },
    });
  });

  it('should parse inputs correctly', () => {
    expect(
      unifyBundlerStats({
        inputs: {},
        outputs: {
          'dist/index.js': {
            bytes: 100,
            inputs: {
              'src/index.ts': {
                bytesInOutput: 100,
              },
            },
          },
        },
      }),
    ).toStrictEqual({
      'dist/index.js': expect.objectContaining({
        inputs: {
          'src/index.ts': {
            bytes: 100,
          },
        },
      }),
    });
  });

  it('should parse imports correctly', () => {
    expect(
      unifyBundlerStats({
        inputs: {},
        outputs: {
          'dist/index.js': {
            bytes: 100,
            imports: [
              {
                path: 'dist/chunks/chunk-WIJM4GGD.js',
                kind: 'import-statement',
              },
            ],
          },
        },
      }),
    ).toStrictEqual({
      'dist/index.js': expect.objectContaining({
        imports: [
          {
            path: 'dist/chunks/chunk-WIJM4GGD.js',
            kind: 'import-statement',
          },
        ],
      }),
    });
  });

  it('should preserve original import paths when present', () => {
    expect(
      unifyBundlerStats({
        inputs: {},
        outputs: {
          'dist/index.js': {
            bytes: 100,
            imports: [
              {
                path: 'node_modules/rxjs/dist/esm/internal/util/isFunction.js',
                kind: 'import-statement',
                original: './util/isFunction',
              },
              {
                path: 'dist/chunks/chunk-WIJM4GGD.js',
                kind: 'import-statement',
              },
            ],
          },
        },
      }),
    ).toStrictEqual({
      'dist/index.js': expect.objectContaining({
        imports: [
          {
            path: 'node_modules/rxjs/dist/esm/internal/util/isFunction.js',
            kind: 'import-statement',
            original: './util/isFunction',
          },
          {
            path: 'dist/chunks/chunk-WIJM4GGD.js',
            kind: 'import-statement',
          },
        ],
      }),
    });
  });

  it('should unify esbuild stats into unified stats structure', () => {
    const esbuildStats: EsBuildCoreStats = {
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
        'dist/bin.js': {
          imports: [
            {
              path: 'dist/chunks/chunk-WIJM4GGD.js',
              kind: 'import-statement',
            },
          ],
          exports: [],
          entryPoint: 'src/bin.ts',
          inputs: {
            'src/bin.ts': {
              bytesInOutput: 366,
            },
          },
          bytes: 479,
        },
        'dist/chunks/chunk-WIJM4GGD.js': {
          imports: [],
          exports: ['calculate', 'externalFunction'],
          inputs: {
            'src/lib/utils/format.ts': {
              bytesInOutput: 269,
            },
            'src/lib/feature-1.ts': {
              bytesInOutput: 269,
            },
            'src/lib/utils/math.ts': {
              bytesInOutput: 145,
            },
          },
          bytes: 806,
        },
        'dist/chunks/feature-2-X2YVDBQK.js': {
          imports: [],
          exports: ['chart'],
          entryPoint: 'src/lib/feature-2.ts',
          inputs: {
            'src/lib/feature-2.ts': {
              bytesInOutput: 38,
            },
          },
          bytes: 82,
        },
      },
    };

    expect(unifyBundlerStats(esbuildStats)).toStrictEqual({
      'dist/bin.js': {
        bytes: 479,
        entryPoint: 'src/bin.ts',
        imports: [
          {
            kind: 'import-statement',
            path: 'dist/chunks/chunk-WIJM4GGD.js',
          },
        ],
        inputs: {
          'src/bin.ts': {
            bytes: 366,
          },
        },
        path: 'dist/bin.js',
      },
      'dist/chunks/chunk-WIJM4GGD.js': {
        bytes: 806,
        imports: [],
        inputs: {
          'src/lib/feature-1.ts': {
            bytes: 269,
          },
          'src/lib/utils/format.ts': {
            bytes: 269,
          },
          'src/lib/utils/math.ts': {
            bytes: 145,
          },
        },
        path: 'dist/chunks/chunk-WIJM4GGD.js',
      },
      'dist/chunks/feature-2-X2YVDBQK.js': {
        bytes: 82,
        entryPoint: 'src/lib/feature-2.ts',
        imports: [],
        inputs: {
          'src/lib/feature-2.ts': {
            bytes: 38,
          },
        },
        path: 'dist/chunks/feature-2-X2YVDBQK.js',
      },
      'dist/index.js': {
        bytes: 496,
        entryPoint: 'src/index.ts',
        imports: [
          {
            kind: 'import-statement',
            path: 'dist/chunks/chunk-WIJM4GGD.js',
          },
          {
            kind: 'dynamic-import',
            path: 'dist/chunks/feature-2-X2YVDBQK.js',
          },
        ],
        inputs: {
          'src/index.ts': {
            bytes: 350,
          },
        },
        path: 'dist/index.js',
      },
    });
  });
});
