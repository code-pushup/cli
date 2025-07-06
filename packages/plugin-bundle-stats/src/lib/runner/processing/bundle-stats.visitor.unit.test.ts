import { describe, expect, it } from 'vitest';
import type { BundleStatsTree } from './bundle-stats.types';
import {
  DEFAULT_CONNECTOR,
  DEFAULT_CONTENT,
  renderAsciiTree,
} from './bundle-stats.visitor';
import { sortTree } from './sort';

describe('renderAsciiTree', () => {
  it('should render tree with chunk containing input file', () => {
    // Simple tree with one chunk and one input
    const tree: BundleStatsTree = {
      root: {
        children: [
          {
            children: [
              {
                children: undefined,
                name: 'node_modules/@angular/core/fesm2022/core.mjs',
                values: {
                  bytes: 84692,
                  childCount: 0,
                  path: 'node_modules/@angular/core/fesm2022/core.mjs',
                  totalSize: 84692,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/core/fesm2022/untracked-BKcld_ew.mjs',
                values: {
                  bytes: 3491,
                  childCount: 0,
                  path: 'node_modules/@angular/core/fesm2022/untracked-BKcld_ew.mjs',
                  totalSize: 3491,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/core/fesm2022/primitives/di.mjs',
                values: {
                  bytes: 95,
                  childCount: 0,
                  path: 'node_modules/@angular/core/fesm2022/primitives/di.mjs',
                  totalSize: 95,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/rxjs/dist/esm/internal/util/isFunction.js',
                values: {
                  bytes: 42,
                  childCount: 0,
                  path: 'node_modules/rxjs/dist/esm/internal/util/isFunction.js',
                  totalSize: 42,
                  type: 'input',
                },
              },
            ],
            name: 'chunk-5QRGP6BJ.js',
            values: {
              bytes: 108481,
              childCount: 4,
              isEntryFile: false,
              path: 'chunk-5QRGP6BJ.js',
              totalSize: 196801,
              type: 'chunk',
            },
          },
          {
            children: [
              {
                children: undefined,
                name: 'node_modules/@angular/router/fesm2022/router-Dwfin5Au.mjs',
                values: {
                  bytes: 64170,
                  childCount: 0,
                  path: 'node_modules/@angular/router/fesm2022/router-Dwfin5Au.mjs',
                  totalSize: 64170,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'src/app/app.component.ts',
                values: {
                  bytes: 17977,
                  childCount: 0,
                  path: 'src/app/app.component.ts',
                  totalSize: 17977,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/platform-browser/fesm2022/dom_renderer-DGKzginR.mjs',
                values: {
                  bytes: 7955,
                  childCount: 0,
                  path: 'node_modules/@angular/platform-browser/fesm2022/dom_renderer-DGKzginR.mjs',
                  totalSize: 7955,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/common/fesm2022/location-Dq4mJT-A.mjs',
                values: {
                  bytes: 5308,
                  childCount: 0,
                  path: 'node_modules/@angular/common/fesm2022/location-Dq4mJT-A.mjs',
                  totalSize: 5308,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/platform-browser/fesm2022/browser-D-u-fknz.mjs',
                values: {
                  bytes: 3535,
                  childCount: 0,
                  path: 'node_modules/@angular/platform-browser/fesm2022/browser-D-u-fknz.mjs',
                  totalSize: 3535,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/router/fesm2022/router_module-DTJgGWLd.mjs',
                values: {
                  bytes: 655,
                  childCount: 0,
                  path: 'node_modules/@angular/router/fesm2022/router_module-DTJgGWLd.mjs',
                  totalSize: 655,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'src/app/app.routes.ts',
                values: {
                  bytes: 101,
                  childCount: 0,
                  path: 'src/app/app.routes.ts',
                  totalSize: 101,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'src/app/app.config.ts',
                values: {
                  bytes: 53,
                  childCount: 0,
                  path: 'src/app/app.config.ts',
                  totalSize: 53,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'src/main.ts',
                values: {
                  bytes: 37,
                  childCount: 0,
                  path: 'src/main.ts',
                  totalSize: 37,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'node_modules/@angular/common/fesm2022/dom_tokens-rA0ACyx7.mjs',
                values: {
                  bytes: 16,
                  childCount: 0,
                  path: 'node_modules/@angular/common/fesm2022/dom_tokens-rA0ACyx7.mjs',
                  totalSize: 16,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'app.component-W2ENO27M.css',
                values: {
                  bytes: 2926,
                  childCount: 0,
                  label: '2.86 kB',
                  path: 'app.component-W2ENO27M.css',
                  totalSize: 2926,
                  type: 'asset',
                },
              },
              {
                children: undefined,
                name: 'chunk-5QRGP6BJ.js',
                values: {
                  childCount: 0,
                  importKind: 'static',
                  path: 'chunk-5QRGP6BJ.js',
                  totalSize: 0,
                  type: 'import',
                },
              },
              {
                children: undefined,
                name: 'chunk-NY7Q4ZJ6.js',
                values: {
                  childCount: 0,
                  importKind: 'dynamic',
                  path: 'chunk-NY7Q4ZJ6.js',
                  totalSize: 0,
                  type: 'import',
                },
              },
            ],
            name: 'main-TVMA6NI7.js',
            values: {
              bytes: 101098,
              childCount: 13,
              isEntryFile: true,
              path: 'main-TVMA6NI7.js',
              totalSize: 203831,
              type: 'chunk',
            },
          },
          {
            children: [
              {
                children: undefined,
                name: 'node_modules/zone.js/fesm2015/zone.js',
                values: {
                  bytes: 34578,
                  childCount: 0,
                  path: 'node_modules/zone.js/fesm2015/zone.js',
                  totalSize: 34578,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'angular:polyfills:angular:polyfills',
                values: {
                  bytes: 0,
                  childCount: 0,
                  path: 'angular:polyfills:angular:polyfills',
                  totalSize: 0,
                  type: 'input',
                },
              },
            ],
            name: 'polyfills-B6TNHZQ6.js',
            values: {
              bytes: 34579,
              childCount: 2,
              isEntryFile: true,
              path: 'polyfills-B6TNHZQ6.js',
              totalSize: 69157,
              type: 'chunk',
            },
          },
          {
            children: [
              {
                children: undefined,
                name: 'src/app/route-1.component.ts',
                values: {
                  bytes: 234,
                  childCount: 0,
                  path: 'src/app/route-1.component.ts',
                  totalSize: 234,
                  type: 'input',
                },
              },
              {
                children: undefined,
                name: 'chunk-5QRGP6BJ.js',
                values: {
                  childCount: 0,
                  importKind: 'static',
                  path: 'chunk-5QRGP6BJ.js',
                  totalSize: 0,
                  type: 'import',
                },
              },
            ],
            name: 'chunk-NY7Q4ZJ6.js',
            values: {
              bytes: 345,
              childCount: 2,
              isEntryFile: true,
              path: 'chunk-NY7Q4ZJ6.js',
              totalSize: 579,
              type: 'chunk',
            },
          },
          {
            children: undefined,
            name: 'styles-5INURTSO.css',
            values: {
              bytes: 0,
              childCount: 0,
              label: '0.00 kB',
              path: 'styles-5INURTSO.css',
              totalSize: 0,
              type: 'asset',
            },
          },
        ],
        name: 'bundle',
        values: {
          bytes: 0,
          childCount: 5,
          path: 'bundle',
          totalSize: 470368,
          type: 'chunk',
        },
      },
      title: 'ESBuild Bundle Stats',
      type: 'basic',
    };
    // Configure filtering for main chunks
    const configs: BundleStatsConfig[] = [
      {
        slug: 'main-chunks',
        title: 'Main Application Chunks',
        include: ['**/*main*.js', '**/*polyfills*.js'],
      },
    ];

    const filteredTrees = filterUnifiedTreeByConfig(tree, configs);

    // Apply node modules reduction and filtering
    const reducedTree = reduceNodeModules(filteredTrees[0]!);

    const sortedTree = sortTree(reducedTree, { by: 'name' });

    const result = renderAsciiTree(sortedTree);

    expect(result).toMatchInlineSnapshot(`
      "└─ 📦 main-TVMA6NI7.js  
      │  ├─ 📄 app.component-W2ENO27M.css  2.86 kB
      │  ├─ ▶ chunk-5QRGP6BJ.js  
      │  ├─ 📄 @angular/common  
      │  ├─ 📄 @angular/platform-browser  
      │  ├─ 📄 @angular/router  
      │  ├─ 📄 src/app/app.component.ts  
      │  ├─ 📄 src/app/app.config.ts  
      │  ├─ 📄 src/app/app.routes.ts  
         └─ 📄 src/main.ts  
      └─ 📦 polyfills-B6TNHZQ6.js  
      │  ├─ 📄 angular:polyfills:angular:polyfills  
         └─ 📄 zone.js  "
    `);
  });

  it('should verify DEFAULT_CONNECTOR work', () => {
    // Test the methods work directly
    const mockNode: ChunkNode = {
      name: 'test.js',
      values: { type: 'chunk', path: 'test.js', bytes: 100 },
      children: [],
    };

    const mockPosition = {
      index: 0,
      isFirst: true,
      isLast: true,
      depth: 0,
      siblingCount: 1,
    };

    const connector = DEFAULT_CONNECTOR.enterChunk?.(mockNode, mockPosition);

    expect(connector).toBe('└─ ');
  });

  it('should verify DEFAULT_CONTENT work', () => {
    // Test the methods work directly
    const mockNode: ChunkNode = {
      name: 'test.js',
      values: { type: 'chunk', path: 'test.js', bytes: 100 },
      children: [],
    };

    const mockPosition = {
      index: 0,
      isFirst: true,
      isLast: true,
      depth: 0,
      siblingCount: 1,
    };

    const content = DEFAULT_CONTENT.enterChunk?.(mockNode, mockPosition);

    expect(content).toBe('📦 test.js  ');
  });
});
