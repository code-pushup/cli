import { describe, expect, it } from 'vitest';
import type { BasicTree } from '../../../models/src/lib/tree.js';
import {
  type BundlerAssetsCoreStats,
  type EsBuildCoreStats,
  type RsbuildCoreStats,
  type WebpackCoreStats,
  unifyBun,
  unifyEsbuild,
  unifyRolldown,
  unifyRollup,
  unifyRsbuild,
  unifyVite,
  unifyWebpack,
} from './unify.js';

const bundlerAssetsCoreStats: BundlerAssetsCoreStats = {
  assets: [
    {
      name: 'dist/bundle.js',
      size: 222,
    },
  ],
  chunks: [
    {
      files: ['dist/bundle.js'],
      modules: [
        {
          name: 'src/index.js',
          size: 156,
        },
        {
          name: 'src/utils.js',
          size: 159,
        },
      ],
    },
  ],
  modules: [
    {
      name: 'src/index.js',
      size: 156,
    },
    {
      name: 'src/utils.js',
      size: 159,
    },
  ],
};

describe('unifyEsbuild', () => {
  it('should unify esbuild stats', () => {
    const esbuildStats: EsBuildCoreStats = {
      inputs: {
        'src/utils.js': {
          bytes: 2595,
          imports: [],
          format: 'esm',
        },
        'src/side-effects.js': {
          bytes: 69,
          imports: [],
          format: 'esm',
        },
        'src/theme.css': {
          bytes: 32,
          imports: [],
        },
        'src/styles.css': {
          bytes: 55,
          imports: [
            {
              path: 'src/theme.css',
              kind: 'import-rule',
            },
          ],
        },
        'src/cjs.cjs': {
          bytes: 56,
          imports: [],
          format: 'cjs',
        },
        'src/dynamic.js': {
          bytes: 61,
          imports: [],
          format: 'esm',
        },
        'src/index.js': {
          bytes: 401,
          imports: [
            {
              path: 'src/utils.js',
              kind: 'import-statement',
            },
            {
              path: 'src/side-effects.js',
              kind: 'import-statement',
            },
            {
              path: 'src/styles.css',
              kind: 'import-statement',
            },
            {
              path: 'src/cjs.cjs',
              kind: 'require-call',
            },
            {
              path: 'src/dynamic.js',
              kind: 'dynamic-import',
            },
            {
              path: '<runtime>',
              kind: 'import-statement',
            },
          ],
          format: 'esm',
        },
      },
      outputs: {
        'dist/bundle.js': {
          inputs: {
            'src/cjs.cjs': {
              bytesInOutput: 156,
            },
            'src/dynamic.js': {
              bytesInOutput: 225,
            },
            'src/utils.js': {
              bytesInOutput: 59,
            },
            'src/side-effects.js': {
              bytesInOutput: 39,
            },
            'src/styles.css': {
              bytesInOutput: 0,
            },
            'src/index.js': {
              bytesInOutput: 341,
            },
          },
          bytes: 1836,
        },
        'dist/bundle.css': {
          inputs: {
            'src/theme.css': {
              bytesInOutput: 32,
            },
            'src/styles.css': {
              bytesInOutput: 31,
            },
          },
          bytes: 105,
        },
      },
    };

    expect(unifyEsbuild(esbuildStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "2595",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/side-effects.js",
                  "values": {
                    "bytes": "69",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/theme.css",
                  "values": {
                    "bytes": "32",
                    "imports": "0",
                  },
                },
                {
                  "children": [
                    {
                      "name": "→ src/theme.css",
                      "values": {
                        "type": "import-rule",
                      },
                    },
                  ],
                  "name": "src/styles.css",
                  "values": {
                    "bytes": "55",
                    "imports": "1",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/cjs.cjs",
                  "values": {
                    "bytes": "56",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/dynamic.js",
                  "values": {
                    "bytes": "61",
                    "imports": "0",
                  },
                },
                {
                  "children": [
                    {
                      "name": "→ src/utils.js",
                      "values": {
                        "type": "import-statement",
                      },
                    },
                    {
                      "name": "→ src/side-effects.js",
                      "values": {
                        "type": "import-statement",
                      },
                    },
                    {
                      "name": "→ src/styles.css",
                      "values": {
                        "type": "import-statement",
                      },
                    },
                    {
                      "name": "→ src/cjs.cjs",
                      "values": {
                        "type": "require-call",
                      },
                    },
                    {
                      "name": "→ src/dynamic.js",
                      "values": {
                        "type": "dynamic-import",
                      },
                    },
                    {
                      "name": "→ <runtime>",
                      "values": {
                        "type": "import-statement",
                      },
                    },
                  ],
                  "name": "src/index.js",
                  "values": {
                    "bytes": "401",
                    "imports": "6",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "7",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/cjs.cjs",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/dynamic.js",
                      "values": {
                        "bytes": "225",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "59",
                      },
                    },
                    {
                      "name": "← src/side-effects.js",
                      "values": {
                        "bytes": "39",
                      },
                    },
                    {
                      "name": "← src/styles.css",
                      "values": {
                        "bytes": "0",
                      },
                    },
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "341",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "1836",
                  },
                },
                {
                  "children": [
                    {
                      "name": "← src/theme.css",
                      "values": {
                        "bytes": "32",
                      },
                    },
                    {
                      "name": "← src/styles.css",
                      "values": {
                        "bytes": "31",
                      },
                    },
                  ],
                  "name": "dist/bundle.css",
                  "values": {
                    "bytes": "105",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "2",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "ESBuild Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyBun', () => {
  it('should unify bun stats', () => {
    const bunStats: BundlerAssetsCoreStats = bundlerAssetsCoreStats;
    expect(unifyBun(bunStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Bun Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyRollup', () => {
  it('should unify rollup stats', () => {
    const rollupStats: BundlerAssetsCoreStats = bundlerAssetsCoreStats;
    expect(unifyRollup(rollupStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Rollup Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyVite', () => {
  it('should unify vite stats', () => {
    const viteStats: BundlerAssetsCoreStats = bundlerAssetsCoreStats;
    expect(unifyVite(viteStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Vite Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyRolldown', () => {
  it('should unify rolldown stats', () => {
    const rolldownStats: BundlerAssetsCoreStats = bundlerAssetsCoreStats;
    expect(unifyRolldown(rolldownStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Rolldown Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyWebpack', () => {
  it('should unify webpack stats', () => {
    const webpackStats: WebpackCoreStats = {
      assets: [
        {
          name: 'dist/bundle.js',
          size: 222,
        },
      ],
      chunks: [
        {
          files: ['dist/bundle.js'],
          modules: [
            {
              name: 'src/index.js',
              size: 156,
              moduleType: 'javascript/esm',
            },
            {
              name: 'src/utils.js',
              size: 159,
              moduleType: 'javascript/esm',
            },
          ],
        },
      ],
      modules: [
        {
          name: 'src/index.js',
          size: 156,
          moduleType: 'javascript/esm',
          reasons: [
            {
              type: 'entry',
              userRequest: 'src/index.js',
            },
          ],
        },
        {
          name: 'src/utils.js',
          size: 159,
          moduleType: 'javascript/esm',
          reasons: [
            {
              type: 'harmony side effect evaluation',
              moduleName: 'src/index.js',
              userRequest: 'src/utils.js',
            },
            {
              type: 'harmony import specifier',
              moduleName: 'src/index.js',
              userRequest: 'src/utils.js',
            },
          ],
        },
      ],
    };

    expect(unifyWebpack(webpackStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Webpack Bundle Stats",
        "type": "basic",
      }
    `);
  });
});

describe('unifyRsbuild', () => {
  it('should unify rsbuild stats', () => {
    const rsbuildStats: RsbuildCoreStats = {
      assets: [
        {
          name: 'dist/bundle.js',
          size: 222,
        },
        {
          name: 'index.html',
          size: 243,
        },
      ],
      chunks: [
        {
          files: ['dist/bundle.js'],
          modules: [
            {
              name: 'src/index.js',
              size: 156,
              moduleType: 'javascript/auto',
            },
            {
              name: 'src/utils.js',
              size: 159,
              moduleType: 'javascript/auto',
            },
          ],
        },
      ],
      modules: [
        {
          name: 'src/index.js',
          size: 156,
          moduleType: 'javascript/auto',
          reasons: [
            {
              type: 'entry',
              userRequest: 'src/index.js',
            },
          ],
        },
        {
          name: 'src/utils.js',
          size: 159,
          moduleType: 'javascript/auto',
          reasons: [
            {
              type: 'esm import',
              moduleName: 'src/index.js',
              userRequest: 'src/utils.js',
            },
          ],
        },
      ],
    };

    expect(unifyRsbuild(rsbuildStats)).toMatchInlineSnapshot(`
      {
        "root": {
          "children": [
            {
              "children": [
                {
                  "children": undefined,
                  "name": "src/index.js",
                  "values": {
                    "bytes": "156",
                    "imports": "0",
                  },
                },
                {
                  "children": undefined,
                  "name": "src/utils.js",
                  "values": {
                    "bytes": "159",
                    "imports": "0",
                  },
                },
              ],
              "name": "inputs",
              "values": {
                "files": "2",
              },
            },
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "← src/index.js",
                      "values": {
                        "bytes": "156",
                      },
                    },
                    {
                      "name": "← src/utils.js",
                      "values": {
                        "bytes": "159",
                      },
                    },
                  ],
                  "name": "dist/bundle.js",
                  "values": {
                    "bytes": "222",
                  },
                },
              ],
              "name": "outputs",
              "values": {
                "files": "1",
              },
            },
          ],
          "name": "bundle",
          "values": {},
        },
        "title": "Rsbuild Bundle Stats",
        "type": "basic",
      }
    `);
  });
});
