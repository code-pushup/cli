import { describe, expect, it } from 'vitest';
import { unifyBundlerStats } from './unify.webpack.js';
import type { WebpackCoreStats } from './unify.webpack.js';

describe('unifyBundlerStats', () => {
  it('should transform basic webpack stats with assets and chunks', () => {
    const webpackStats: WebpackCoreStats = {
      assets: [
        {
          name: 'bundle.js',
          size: 16_823,
          chunks: ['main'],
          chunkNames: ['main'],
          emitted: true,
          type: 'asset',
        },
      ],
      chunks: [
        {
          id: 'main',
          names: ['main'],
          files: ['bundle.js'],
          size: 8415,
          modules: [
            {
              identifier: './src/index.ts',
              name: './src/index.ts',
              size: 463,
              chunks: ['main'],
              depth: 0,
              reasons: [
                {
                  moduleIdentifier: null,
                  module: null,
                  moduleName: null,
                  type: 'entry',
                  userRequest: './src/index.ts',
                  loc: 'main',
                },
              ],
              type: 'module',
              moduleType: 'javascript/auto',
              issuer: null,
              issuerName: null,
              providedExports: ['default', 'indexOnlyFunction'],
            },
          ],
          parents: [],
          children: [],
          entry: true,
          initial: true,
          runtime: ['main'],
        },
      ],
      modules: [
        {
          identifier: './src/index.ts',
          name: './src/index.ts',
          size: 463,
          chunks: ['main'],
          depth: 0,
          reasons: [
            {
              moduleIdentifier: null,
              module: null,
              moduleName: null,
              type: 'entry',
              userRequest: './src/index.ts',
              loc: 'main',
            },
          ],
          type: 'module',
          moduleType: 'javascript/auto',
          issuer: null,
          issuerName: null,
          providedExports: ['default', 'indexOnlyFunction'],
        },
      ],
      entrypoints: {
        main: {
          name: 'main',
          chunks: ['main'],
          assets: [{ name: 'bundle.js', size: 16_823 }],
        },
      },
    };

    expect(unifyBundlerStats(webpackStats)).toStrictEqual({
      'bundle.js': {
        path: 'bundle.js',
        bytes: 16_823,
        imports: [],
        inputs: {
          './src/index.ts': {
            bytes: 463,
          },
        },
        entryPoint: './src/index.ts',
      },
    });
  });
});
