import { describe, expect, it } from 'vitest';
import { type SondaCoreStats, unifyBundlerStats } from './unify.sonda.js';

describe('unifyBundlerStats (Sonda)', () => {
  it('should handle minimal stats with single asset', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 100,
        },
      ],
      connections: [],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    expect(unifyBundlerStats(sondaStats, {})).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 100,
        imports: [],
        inputs: {},
      },
    });
  });

  it('should map entrypoints correctly', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 100,
        },
        {
          kind: 'filesystem',
          name: 'src/index.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 100,
        },
      ],
      connections: [
        {
          kind: 'entrypoint',
          source: 'src/index.ts',
          target: 'dist/index.js',
          original: null,
        },
      ],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    expect(unifyBundlerStats(sondaStats, {})).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 100,
        entryPoint: 'src/index.ts',
        imports: [],
        inputs: {
          'src/index.ts': {
            bytes: 100,
          },
        },
      },
    });
  });

  it('should parse imports and build dependency tree', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 200,
        },
        {
          kind: 'filesystem',
          name: 'src/index.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 100,
        },
        {
          kind: 'filesystem',
          name: 'src/lib/utils.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 50,
        },
      ],
      connections: [
        {
          kind: 'entrypoint',
          source: 'src/index.ts',
          target: 'dist/index.js',
          original: null,
        },
        {
          kind: 'import',
          source: 'src/index.ts',
          target: 'src/lib/utils.ts',
          original: './lib/utils',
        },
      ],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    expect(unifyBundlerStats(sondaStats, {})).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 200,
        entryPoint: 'src/index.ts',
        imports: [
          {
            path: 'src/lib/utils.ts',
            kind: 'import-statement',
            original: './lib/utils',
          },
        ],
        inputs: {
          'src/index.ts': {
            bytes: 100,
          },
          'src/lib/utils.ts': {
            bytes: 50,
          },
        },
      },
    });
  });

  it('should handle dynamic imports', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 150,
        },
        {
          kind: 'filesystem',
          name: 'src/index.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 100,
        },
        {
          kind: 'filesystem',
          name: 'src/lib/lazy.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 50,
        },
      ],
      connections: [
        {
          kind: 'entrypoint',
          source: 'src/index.ts',
          target: 'dist/index.js',
          original: null,
        },
        {
          kind: 'dynamic-import',
          source: 'src/index.ts',
          target: 'src/lib/lazy.ts',
          original: './lib/lazy',
        },
      ],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    expect(unifyBundlerStats(sondaStats, {})).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 150,
        entryPoint: 'src/index.ts',
        imports: [
          {
            path: 'src/lib/lazy.ts',
            kind: 'dynamic-import',
            original: './lib/lazy',
          },
        ],
        inputs: {
          'src/index.ts': {
            bytes: 100,
          },
          'src/lib/lazy.ts': {
            bytes: 50,
          },
        },
      },
    });
  });

  it('should exclude outputs matching patterns', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 100,
        },
        {
          kind: 'asset',
          name: 'dist/index.js.map',
          type: 'other',
          uncompressed: 200,
        },
      ],
      connections: [],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    const result = unifyBundlerStats(sondaStats, {
      excludeOutputs: ['**/*.map'],
    });

    expect(result).toStrictEqual({
      'dist/index.js': {
        path: 'dist/index.js',
        bytes: 100,
        imports: [],
        inputs: {},
      },
    });
    expect(result['dist/index.js.map']).toBeUndefined();
  });

  it('should handle complex multi-entry bundle with shared chunks', () => {
    const sondaStats: SondaCoreStats = {
      metadata: {
        version: '0.10.1',
        integration: 'esbuild',
        sources: false,
        gzip: false,
        brotli: false,
      },
      resources: [
        {
          kind: 'asset',
          name: 'dist/index.js',
          type: 'script',
          uncompressed: 496,
        },
        {
          kind: 'asset',
          name: 'dist/bin.js',
          type: 'script',
          uncompressed: 479,
        },
        {
          kind: 'asset',
          name: 'dist/chunks/chunk.js',
          type: 'script',
          uncompressed: 806,
        },
        {
          kind: 'filesystem',
          name: 'src/index.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 350,
        },
        {
          kind: 'filesystem',
          name: 'src/bin.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 366,
        },
        {
          kind: 'filesystem',
          name: 'src/lib/feature-1.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 269,
        },
        {
          kind: 'filesystem',
          name: 'src/lib/utils/format.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 269,
        },
        {
          kind: 'filesystem',
          name: 'src/lib/utils/math.ts',
          type: 'script',
          format: 'esm',
          uncompressed: 145,
        },
      ],
      connections: [
        {
          kind: 'entrypoint',
          source: 'src/index.ts',
          target: 'dist/index.js',
          original: null,
        },
        {
          kind: 'entrypoint',
          source: 'src/bin.ts',
          target: 'dist/bin.js',
          original: null,
        },
        {
          kind: 'import',
          source: 'src/index.ts',
          target: 'src/lib/feature-1.ts',
          original: './lib/feature-1',
        },
        {
          kind: 'import',
          source: 'src/bin.ts',
          target: 'src/lib/feature-1.ts',
          original: './lib/feature-1',
        },
        {
          kind: 'import',
          source: 'src/lib/feature-1.ts',
          target: 'src/lib/utils/format.ts',
          original: './utils/format',
        },
        {
          kind: 'import',
          source: 'src/lib/feature-1.ts',
          target: 'src/lib/utils/math.ts',
          original: './utils/math',
        },
      ],
      dependencies: [],
      issues: [],
      sourcemaps: [],
    };

    const result = unifyBundlerStats(sondaStats, {});

    expect(result['dist/index.js']).toStrictEqual({
      path: 'dist/index.js',
      bytes: 496,
      entryPoint: 'src/index.ts',
      imports: [
        {
          path: 'src/lib/feature-1.ts',
          kind: 'import-statement',
          original: './lib/feature-1',
        },
        {
          path: 'src/lib/utils/format.ts',
          kind: 'import-statement',
          original: './utils/format',
        },
        {
          path: 'src/lib/utils/math.ts',
          kind: 'import-statement',
          original: './utils/math',
        },
      ],
      inputs: {
        'src/index.ts': {
          bytes: 350,
        },
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
    });

    expect(result['dist/bin.js']).toStrictEqual({
      path: 'dist/bin.js',
      bytes: 479,
      entryPoint: 'src/bin.ts',
      imports: [
        {
          path: 'src/lib/feature-1.ts',
          kind: 'import-statement',
          original: './lib/feature-1',
        },
        {
          path: 'src/lib/utils/format.ts',
          kind: 'import-statement',
          original: './utils/format',
        },
        {
          path: 'src/lib/utils/math.ts',
          kind: 'import-statement',
          original: './utils/math',
        },
      ],
      inputs: {
        'src/bin.ts': {
          bytes: 366,
        },
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
    });
  });
});
